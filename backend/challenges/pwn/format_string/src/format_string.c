#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

#define BUF_SIZE 256

void setup() {
    setvbuf(stdin, NULL, _IONBF, 0);
    setvbuf(stdout, NULL, _IONBF, 0);
    setvbuf(stderr, NULL, _IONBF, 0);
}

void vuln() {
    char flag[64];
    char buf[BUF_SIZE];

    FILE *f = fopen("/flag.txt", "r");
    if (f == NULL) {
        puts("flag.txt not found");
        exit(1);
    }
    fgets(flag, sizeof(flag), f);
    fclose(f);

    /* Remove trailing newline */
    flag[strcspn(flag, "\n")] = '\0';

    printf("=== Format String Fun ===\n");
    printf("Can you read the flag from the stack?\n");
    printf("Input: ");

    if (fgets(buf, sizeof(buf), stdin) == NULL) {
        return;
    }
    buf[strcspn(buf, "\n")] = '\0';

    /* Vulnerable printf - no format specifier! */
    printf(buf);
    printf("\n");

    printf("Bye!\n");
}

int main() {
    setup();
    vuln();
    return 0;
}
