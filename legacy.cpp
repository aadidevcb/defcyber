#include <iostream>
#include <string>
#include <csignal>
#include <unistd.h>
#include <sys/select.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <vector>
#include <cstdio>
#include <cstdlib>

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

void kill_other_legacy() {
    auto pids = get_pids_by_name("legacy");
    pid_t mypid = getpid();
    for (int pid : pids) {
        if (pid > 0 && pid != mypid) {
            kill(pid, SIGKILL);
        }
    }
}

std::string get_input_with_timeout(int timeout_sec) {
    fd_set set;
    struct timeval timeout;
    FD_ZERO(&set);
    FD_SET(STDIN_FILENO, &set);
    timeout.tv_sec = timeout_sec;
    timeout.tv_usec = 0;
    int rv = select(STDIN_FILENO + 1, &set, NULL, NULL, &timeout);
    std::string input;
    if (rv > 0) {
        std::getline(std::cin, input);
        if (input.empty()) input = "noanswer";
    } else {
        input = "noanswer";
    }
    return input;
}

int main() {
    while (true) {
        kill_other_legacy();
        std::cout << "Enter your name: ";
        std::cout.flush();
        std::string name = get_input_with_timeout(10);
        std::cout << "Hello " << name << std::endl;
        // Sleep 1 second before restarting
        sleep(1);
    }
    return 0;
}