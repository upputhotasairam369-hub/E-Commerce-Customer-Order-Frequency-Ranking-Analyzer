#include <algorithm>
#include <chrono>
#include <cctype>
#include <iomanip>
#include <iostream>
#include <map>
#include <sstream>
#include <string>
#include <vector>

using Frequency = std::pair<std::string, int>;
std::string escapeJson(const std::string& s) {
    std::ostringstream out;
    for (unsigned char c : s) {
        if (c == '"' || c == '\\') out << '\\' << c;
        else if (c < 32) out << "\\u" << std::hex << std::setw(4) << std::setfill('0') << int(c) << std::dec;
        else out << c;
    }
    return out.str();
}
std::string normalize(const std::string& s, bool fold) {
    std::string result;
    bool space = false;
    for (unsigned char c : s) {
        if (std::isspace(c)) { space = !result.empty(); continue; }
        if (space) result += ' ';
        space = false;
        result += fold && c >= 'A' && c <= 'Z' ? char(c + ('a' - 'A')) : char(c);
    }
    return result;
}
int main(int argc, char** argv) {
    bool json = false, fold = true;
    for (int i = 1; i < argc; ++i) {
        std::string arg = argv[i];
        if (arg == "--json") json = true;
        else if (arg == "--case-sensitive") fold = false;
        else { std::cerr << "Unknown option: " << arg << '\n'; return 1; }
    }
    std::map<std::string, int> counts;
    std::vector<std::string> queries;
    std::string line;
    while (std::getline(std::cin, line)) {
        auto query = normalize(line, fold);
        if (query.empty()) continue;
        if (queries.size() >= 10000 || query.size() > 500) {
            std::cerr << "Limit exceeded: at most 10,000 queries and 500 bytes per query.\n"; return 1;
        }
        queries.push_back(query);
        ++counts[query];
    }
    std::vector<Frequency> ranked(counts.begin(), counts.end());
    std::sort(ranked.begin(), ranked.end(), [](const auto& a, const auto& b) {
        return a.second != b.second ? a.second > b.second : a.first < b.first;
    });
    if (!json) {
        std::cout << "\nQUERYLENS | CUSTOMER SEARCH FREQUENCY\nTotal queries: " << queries.size()
                  << " | Unique queries: " << counts.size() << "\n\nALPHABETICAL FREQUENCY TABLE\n";
        for (const auto& [term, count] : counts) std::cout << std::left << std::setw(40) << term << " " << count << '\n';
        std::cout << "\nVOLUME RANKING (ties sorted alphabetically)\n";
        int rank = 0;
        for (const auto& [term, count] : ranked) std::cout << ++rank << ". " << term << " — " << count << '\n';
        std::cout << "\nLookup: std::map O(log U); unsorted std::vector O(U), where U is unique queries.\n";
        return 0;
    }
    // Identical successful-key workload on two containers holding unique terms.
    std::vector<Frequency> linear(counts.begin(), counts.end());
    std::vector<std::string> targets;
    for (const auto& entry : linear) targets.push_back(entry.first);
    const int operations = targets.empty() ? 0 : 20000;
    volatile long long checksum = 0; // Keep optimized builds from eliminating lookup work.
    auto measure = [&](bool useMap) {
        auto start = std::chrono::steady_clock::now();
        for (int i = 0; i < operations; ++i) {
            const auto& key = targets[static_cast<std::size_t>(i) % targets.size()];
            if (useMap) { auto it = counts.find(key); if (it != counts.end()) checksum += it->second; }
            else { for (const auto& item : linear) if (item.first == key) { checksum += item.second; break; } }
        }
        return std::chrono::duration<double, std::micro>(std::chrono::steady_clock::now() - start).count();
    };
    double mapUs = operations ? measure(true) : 0;
    double vectorUs = operations ? measure(false) : 0;
    std::cout << "{\"total\":" << queries.size() << ",\"unique\":" << counts.size() << ",\"alphabetical\":[";
    bool first = true;
    for (const auto& [term, count] : counts) {
        if (!first) std::cout << ',';
        first = false;
        std::cout << "{\"term\":\"" << escapeJson(term) << "\",\"count\":" << count << '}';
    }
    std::cout << "],\"ranked\":[";
    first = true;
    for (const auto& [term, count] : ranked) {
        if (!first) std::cout << ',';
        first = false;
        std::cout << "{\"term\":\"" << escapeJson(term) << "\",\"count\":" << count << '}';
    }
    std::cout << "],\"benchmark\":{\"operations\":" << operations << ",\"mapUs\":" << mapUs
              << ",\"vectorUs\":" << vectorUs << "}}\n";
}
