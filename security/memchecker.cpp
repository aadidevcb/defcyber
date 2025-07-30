#include <sys/ptrace.h>
#include <sys/wait.h>
#include <sys/user.h>
#include <unistd.h>
#include <dirent.h>
#include <fcntl.h>
#include <fstream>
#include <iostream>
#include <sstream>
#include <vector>
#include <cstring>
#include <sys/stat.h>
#include <cstdint>
#include <openssl/sha.h>
#include <iomanip>
#include <map>
#include <string>
#include <regex>

// Function to compute SHA256 of a file
std::string compute_sha256(const std::string& filepath) {
    std::ifstream file(filepath, std::ios::binary);
    if (!file) {
        throw std::runtime_error("Cannot open file: " + filepath);
    }

    SHA256_CTX sha256;
    SHA256_Init(&sha256);
    char buffer[8192];
    while (file.good()) {
        file.read(buffer, sizeof(buffer));
        SHA256_Update(&sha256, buffer, file.gcount());
    }

    unsigned char hash[SHA256_DIGEST_LENGTH];
    SHA256_Final(hash, &sha256);

    std::ostringstream oss;
    for (int i = 0; i < SHA256_DIGEST_LENGTH; ++i) {
        oss << std::hex << std::setw(2) << std::setfill('0') << (int)hash[i];
    }

    return oss.str();
}

// Function to extract the SHA256 value from the meta file
std::string extract_hash_from_meta(const std::string& metafile) {
    std::ifstream file(metafile);
    if (!file) {
        throw std::runtime_error("Cannot open meta file: " + metafile);
    }

    std::string content((std::istreambuf_iterator<char>(file)),
                         std::istreambuf_iterator<char>());

    std::regex re("\"\\[heap\\]\"\\s*:\\s*\"([a-fA-F0-9]+)\"");
    std::smatch match;
    if (std::regex_search(content, match, re)) {
        return match[1];
    }

    throw std::runtime_error("SHA256 value for [heap] not found in meta file.");
}



bool is_legacy_process(pid_t pid) {
    std::string comm_path = "/proc/" + std::to_string(pid) + "/comm";
    std::ifstream comm(comm_path);
    std::string name;
    if (comm >> name) {
        return name == "legacy";
    }
    return false;
}

void ensure_temp_dir() {
    struct stat st;
    if (stat("./Temp", &st) != 0) {
        if (mkdir("./Temp", 0755) != 0) {
            perror("mkdir ./Temp failed");
            exit(1);
        }
    }
}

void dump_memory(pid_t pid) {
    std::stringstream maps_path, mem_path;
    maps_path << "/proc/" << pid << "/maps";
    mem_path  << "/proc/" << pid << "/mem";

    std::ifstream maps(maps_path.str());
    std::ifstream mem(mem_path.str(), std::ios::in | std::ios::binary);
    std::ofstream out("./Temp/memdump.bin", std::ios::binary);
    std::ofstream meta("./Temp/memdump_meta.txt");

    if (!maps || !mem || !out || !meta) {
        std::cerr << "[!] Failed to open one or more files\n";
        return;
    }

    std::string line;
    std::map<std::string, std::string> region_hashes;


    while (std::getline(maps, line)) {
        uintptr_t start, end;
        char perms[5] = {0};
        char path_buf[256] = {0};

        sscanf(line.c_str(), "%lx-%lx %4s %*s %*s %*s %255[^\n]", &start, &end, perms, path_buf);
        std::string path = path_buf;

        // Only read [heap]
        bool is_heap = path.find("[heap]") != std::string::npos;
        if (!is_heap) continue;
        if (perms[0] != 'r' || perms[1] != 'w') continue;

        size_t region_size = end - start;
        std::vector<char> buffer(region_size);

        mem.seekg(start);
        mem.read(buffer.data(), region_size);
        std::streamsize bytes_read = mem.gcount();
        if (bytes_read <= 0) continue;

        // Compute SHA256
        unsigned char hash[SHA256_DIGEST_LENGTH];
        SHA256((unsigned char*)buffer.data(), bytes_read, hash);

        std::ostringstream hash_str;
        for (int i = 0; i < SHA256_DIGEST_LENGTH; ++i)
            hash_str << std::hex << std::setw(2) << std::setfill('0') << (int)hash[i];

        // Store hash
        region_hashes["[heap]"] = hash_str.str();

        // Write memory
        out.write(buffer.data(), bytes_read);
    }

    // Write metadata
    meta << "{\n";
    for (auto it = region_hashes.begin(); it != region_hashes.end(); ++it) {
        meta << "  \"" << it->first << "\": \"" << it->second << "\"";
        if (std::next(it) != region_hashes.end()) meta << ",";
        meta << "\n";
    }
    meta << "}\n";

    std::cout << "[+] Dumped [heap] memory only.\n";
}




void trace_process(pid_t pid) {
    if (ptrace(PTRACE_ATTACH, pid, NULL, NULL) < 0) {
        perror("ptrace_attach");
        return;
    }

    waitpid(pid, NULL, 0);
    ptrace(PTRACE_SETOPTIONS, pid, 0, PTRACE_O_TRACESYSGOOD);

    std::cout << "[*] Tracing syscalls for PID " << pid << "...\n";

    bool dumped = false;
    while (true) {
        if (ptrace(PTRACE_SYSCALL, pid, NULL, NULL) < 0)
            break;
        int status;
        waitpid(pid, &status, 0);
        if (WIFEXITED(status)) break;

        if (!dumped) {
            dump_memory(pid);
            dumped = true;
        }

        if (ptrace(PTRACE_SYSCALL, pid, NULL, NULL) < 0)
            break;
        waitpid(pid, &status, 0);
        if (WIFEXITED(status)) break;
    }

    ptrace(PTRACE_DETACH, pid, NULL, NULL);
}

int main() {
    int count=0;
    ensure_temp_dir(); // Make ./Temp directory if needed

    while (true) {
        int check=0;
        bool affected;
        DIR* proc = opendir("/proc");
        if (!proc) {
            perror("opendir /proc");
            return 1;
        }

        struct dirent* entry;
        while ((entry = readdir(proc))) {
            if (entry->d_type == DT_DIR) {
                pid_t pid = atoi(entry->d_name);
                if (pid <= 0) continue;

                if (is_legacy_process(pid)) {
                    std::cout << "[*] Found 'legacy' process: PID " << pid << "\n";
                    trace_process(pid);
                    check=1;
                }
            }
        }
        if (check == 1) {
            count++;
            std::string meta_hash = extract_hash_from_meta("./Temp/memdump_meta.txt");
            std::string file_hash = compute_sha256("./original_mem_dump/memdump.bin");

            std::cout << "Extracted hash:  " << meta_hash << "\n";
            std::cout << "Computed hash:   " << file_hash << "\n";

            if (meta_hash == file_hash) {
                std::cout << "[+] Hashes match.\n";
                affected = false;
            } else {
                std::cout << "[-] Hashes do NOT match.\n";
                affected = true;
            }
            std::ofstream outfile("/usr/src/app/shared/output.json");
            if (!outfile) {
                std::cerr << "Failed to open file for writing.\n";
                return 1;
            }
            outfile << "{\"count\":" << count << ",\n";
            outfile << "\"affected\":" << (affected ? "false" : "true") << "}";
            outfile.close();
            std::cout << "Data written to output.json\n";
        }
        closedir(proc);
        sleep(1); 
    }
}
