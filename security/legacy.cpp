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
        std::cout << "Enter your name: ";
        std::cout.flush();
        std::string name = get_input_with_timeout(10);
        std::cout << "Hello " << name << std::endl;
        // Sleep 1 second before restarting
        sleep(1);
    return 0;
}