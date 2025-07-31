#include <sys/types.h>
#include <signal.h>
#include <unistd.h> 
#include <cstdio>
#include <cstring>
#include <vector>
#include <string>
#include <cstdlib>
#include <iostream>
#include <fstream>
#include <regex>
#include <vector>
#include <unistd.h>

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

void kill_and_restart_setup_and_monit() {
    auto kill_by_name = [](const std::string& name, pid_t mypid) {
        auto pids = get_pids_by_name(name);
        for (int pid : pids) {
            if (pid > 0 && pid != mypid) {
                char cmd[64];
                snprintf(cmd, sizeof(cmd), "kill -9 %d", pid);
                system(cmd);
            }
        }
    };
    pid_t mypid = getpid();
    kill_by_name("setup_and_monit", mypid);
    kill_by_name("iptables_speed_", mypid);
    // Start setup_and_monit in background with sudo
    system("./setup_and_monitor.sh &");
}


void normal() {
    // Flush all rules
    system("iptables -F INPUT");
    system("iptables -F OUTPUT");
    system("iptables -F FORWARD");
    // Set default policies to ACCEPT
    int res1 = system("iptables -P INPUT ACCEPT");
    int res2 = system("iptables -P OUTPUT ACCEPT");
    int res3 = system("iptables -P FORWARD ACCEPT");
    // Remove loopback-only rules if present
    system("iptables -D INPUT -i lo -j ACCEPT 2>/dev/null");
    system("iptables -D OUTPUT -o lo -j ACCEPT 2>/dev/null");
    // Kill and restart setup_and_monit
    kill_and_restart_setup_and_monit();
    if (res1 == 0 && res2 == 0 && res3 == 0) {
        std::cout << "Firewall reverted to normal (all traffic allowed)." << std::endl;
    } else {
        std::cerr << "Failed to revert firewall to normal." << std::endl;
    }
}

void show_ports() {
    std::vector<int> open_ports;
    FILE* fp = popen("iptables -L INPUT -n --line-numbers", "r");
    if (!fp) {
        std::cerr << "Failed to run iptables command." << std::endl;
        return;
    }
    char buffer[512];
    std::regex port_regex("dpt:([0-9]+)");
    while (fgets(buffer, sizeof(buffer), fp)) {
        std::string line(buffer);
        std::smatch match;
        if (std::regex_search(line, match, port_regex)) {
            try {
                open_ports.push_back(std::stoi(match[1]));
            } catch (...) {}
        }
    }
    pclose(fp);
    std::ofstream json_file("/usr/src/app/shared/ports.json");
    json_file << "{\n  \"open_ports\": [";
    for (size_t i = 0; i < open_ports.size(); ++i) {
        json_file << open_ports[i];
        if (i + 1 < open_ports.size()) json_file << ", ";
    }
    json_file << "]\n}" << std::endl;
    json_file.close();
    std::cout << "Open ports written to ports.json" << std::endl;
}
#include <iostream>
#include <cstdlib>
#include <string>
void shutdown() {
    // Flush all rules
    system("iptables -F INPUT");
    system("iptables -F OUTPUT");
    system("iptables -F FORWARD");
    // Block all outgoing and forwarding traffic
    int res1 = system("iptables -P OUTPUT DROP");
    int res2 = system("iptables -P FORWARD DROP");
    int res3 = system("iptables -P INPUT DROP");
    // Allow loopback
    int res4 = system("iptables -A INPUT -i lo -j ACCEPT");
    int res5 = system("iptables -A OUTPUT -o lo -j ACCEPT");
    if (res1 == 0 && res2 == 0 && res3 == 0 && res4 == 0 && res5 == 0) {
        std::cout << "Device is now disconnected from the internet and only local operations are allowed." << std::endl;
    } else {
        std::cerr << "Failed to fully shutdown network connectivity." << std::endl;
    }
}


void open_port(const std::string& port) {
    if (port.empty()) {
        std::cerr << "Usage: open <port>" << std::endl;
        return;
    }
    std::string check_cmd = "iptables -C INPUT -p tcp --dport " + port + " -j ACCEPT 2>/dev/null";
    std::string add_cmd = "iptables -A INPUT -p tcp --dport " + port + " -j ACCEPT";
    int check = system(check_cmd.c_str());
    if (check != 0) {
        int res = system(add_cmd.c_str());
        if (res == 0)
            std::cout << "Port " << port << " opened." << std::endl;
        else
            std::cerr << "Failed to open port " << port << "." << std::endl;
    } else {
        std::cout << "Port " << port << " is already open." << std::endl;
    }
}

void close_port(const std::string& port) {
    if (port.empty()) {
        std::cerr << "Usage: close <port>" << std::endl;
        return;
    }
    std::string del_cmd = "iptables -D INPUT -p tcp --dport " + port + " -j ACCEPT 2>/dev/null";
    int res = system(del_cmd.c_str());
    if (res == 0)
        std::cout << "Port " << port << " closed." << std::endl;
    else
        std::cout << "Port " << port << " was not open." << std::endl;
}

int main(int argc, char* argv[]) {
    if (argc < 2) {
        std::cerr << "Usage: " << argv[0] << " {open|close <port>|shutdown|normal|show}" << std::endl;
        return 1;
    }
    std::string cmd = argv[1];
    if (cmd == "open" || cmd == "close") {
        if (argc != 3) {
            std::cerr << "Usage: " << argv[0] << " {open|close} <port>" << std::endl;
            return 1;
        }
        std::string port = argv[2];
        if (cmd == "open") {
            open_port(port);
        } else {
            close_port(port);
        }
    } else if (cmd == "shutdown") {
        shutdown();
    } else if (cmd == "normal") {
        normal();
    } else if (cmd == "show") {
        show_ports();
    } else {
        std::cerr << "Usage: " << argv[0] << " {open|close <port>|shutdown|normal|show}" << std::endl;
        return 1;
    }
    return 0;
}
