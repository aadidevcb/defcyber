#include <cstdio>
#include <cstdlib>
#include <vector>
#include <algorithm>
#include <iostream>
#include <filesystem>
#include <chrono>
#include <thread>
#include <ctime>
#include <csignal>
#include <unistd.h>

namespace fs = std::filesystem;


// Helper to get PIDs of running process by name
std::vector<int> get_pids_by_name(const std::string& proc_name) {
    std::vector<int> pids;
    FILE* pipe = popen(("pgrep " + proc_name).c_str(), "r");
    if (!pipe) return pids;
    char buf[128];
    while (fgets(buf, sizeof(buf), pipe)) {
        pids.push_back(std::atoi(buf));
    }
    pclose(pipe);
    return pids;
}

// Kill all processes by name
void kill_processes(const std::string& proc_name) {
    auto pids = get_pids_by_name(proc_name);
    pid_t mypid = getpid();
    for (int pid : pids) {
        if (pid > 0 && pid != mypid) {
            kill(pid, SIGKILL);
        }
    }
}

void copy_directory(const fs::path& source, const fs::path& destination) {
    if (!fs::exists(source) || !fs::is_directory(source)) {
        std::cerr << "Source directory does not exist or is not a directory.\n";
        return;
    }
    if (!fs::exists(destination)) {
        fs::create_directories(destination);
    }
    for (const auto& entry : fs::recursive_directory_iterator(source)) {
        const auto& path = entry.path();
        auto relative_path = fs::relative(path, source);
        auto dest = destination / relative_path;
        if (fs::is_directory(path)) {
            fs::create_directories(dest);
        } else if (fs::is_regular_file(path)) {
            fs::copy_file(path, dest, fs::copy_options::overwrite_existing);
        }
    }
}

fs::path get_latest_backup(const fs::path& backup_root) {
    fs::path latest;
    std::time_t latest_time = 0;
    for (const auto& entry : fs::directory_iterator(backup_root)) {
        if (fs::is_directory(entry)) {
            std::string name = entry.path().filename();
            std::tm tm = {};
            if (strptime(name.c_str(), "%Y%m%d_%H%M%S", &tm)) {
                std::time_t t = mktime(&tm);
                if (t > latest_time) {
                    latest_time = t;
                    latest = entry.path();
                }
            }
        }
    }
    return latest;
}

void overwrite_legacy_with_backup(const fs::path& legacy_dir, const fs::path& backup_dir) {
    if (fs::exists(legacy_dir)) {
        fs::remove_all(legacy_dir);
    }
    copy_directory(backup_dir, legacy_dir);
}

void start_legacy() {
    // Start legacy as a background process
    std::system("./legacy &");
}

void copy_file_backup(const fs::path& source, const fs::path& destination) {
    if (!fs::exists(source) || !fs::is_regular_file(source)) {
        std::cerr << "Source file does not exist or is not a regular file.\n";
        return;
    }
    auto parent = destination.parent_path();
    if (!parent.empty() && !fs::exists(parent)) {
        fs::create_directories(parent);
    }
    fs::copy_file(source, destination, fs::copy_options::overwrite_existing);
}

void DOBACKUP() {
    const fs::path legacy_file = "legacy"; // legacy file, not directory
    const fs::path backup_root = "backupdir";
    // 1. Kill running legacy and backup processes
    kill_processes("legacy");
    kill_processes("backup");

    // 2. Restore latest backup if it exists
    fs::path latest_backup;
    std::time_t latest_time = 0;
    for (const auto& entry : fs::directory_iterator(backup_root)) {
        if (fs::is_regular_file(entry)) {
            std::string name = entry.path().filename();
            // Expecting format: legacy_YYYYMMDD_HHMMSS
            if (name.rfind("legacy_", 0) == 0 && name.size() > 14) {
                std::string timestr = name.substr(7); // after 'legacy_'
                std::tm tm = {};
                if (strptime(timestr.c_str(), "%Y%m%d_%H%M%S", &tm)) {
                    std::time_t t = mktime(&tm);
                    if (t > latest_time) {
                        latest_time = t;
                        latest_backup = entry.path();
                    }
                }
            }
        }
    }
    if (!latest_backup.empty()) {
        std::cout << "Restoring latest backup '" << latest_backup << "' to '" << legacy_file << "'...\n";
        copy_file_backup(latest_backup, legacy_file);
    }

    // 3. Start legacy
    start_legacy();

    // 4. Continue backup loop
    while (true) {
        std::time_t t = std::time(nullptr);
        char buf[32];
        std::strftime(buf, sizeof(buf), "%Y%m%d_%H%M%S", std::localtime(&t));
        fs::path backup_file = backup_root / (std::string("legacy_") + buf);
        std::cout << "Backing up file '" << legacy_file << "' to '" << backup_file << "'...\n";
        copy_file_backup(legacy_file, backup_file);
        std::cout << "Backup complete. Next backup in 24 hours.\n";
        std::this_thread::sleep_for(std::chrono::hours(24));
    }
}

int main() {
    DOBACKUP();
    return 0;
}
