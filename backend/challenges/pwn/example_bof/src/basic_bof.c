/*
 * Basic Buffer Overflow Challenge
 *
 * gets()로 입력을 받아 스택 버퍼 오버플로우가 발생한다.
 * return address를 win() 함수로 덮어쓰면 플래그를 획득할 수 있다.
 *
 * Compile: gcc -o basic_bof basic_bof.c -fno-stack-protector -no-pie -z execstack
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

void win(void) {
    FILE *f = fopen("/flag.txt", "r");
    if (f == NULL) {
        puts("Flag file not found.");
        exit(1);
    }
    char flag[128];
    if (fgets(flag, sizeof(flag), f) != NULL) {
        printf("%s\n", flag);
    }
    fclose(f);
    exit(0);
}

void vuln(void) {
    char buf[64];
    printf("Enter your name: ");
    fflush(stdout);
    gets(buf);  /* vulnerable */
    printf("Hello, %s!\n", buf);
}

int main(void) {
    setvbuf(stdin, NULL, _IONBF, 0);
    setvbuf(stdout, NULL, _IONBF, 0);
    setvbuf(stderr, NULL, _IONBF, 0);

    printf("=== Basic Buffer Overflow ===\n");
    printf("Can you call win()?\n\n");

    vuln();

    printf("Goodbye!\n");
    return 0;
}
