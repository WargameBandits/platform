/*
 * Baby Reversing Challenge
 *
 * 올바른 패스워드를 입력하면 플래그가 출력됩니다.
 * 패스워드는 각 바이트가 XOR 0x42로 인코딩되어 저장됩니다.
 */

#include <stdio.h>
#include <string.h>
#include <stdlib.h>

/* Encoded password: "s3cr3t_p4ss" XOR 0x42 */
static const unsigned char encoded[] = {
    0x31, 0x71, 0x21, 0x30, 0x71, 0x36, 0x1d, 0x32, 0x72, 0x31, 0x31, 0x00
};

#define XOR_KEY 0x42

int check_password(const char *input) {
    size_t len = strlen((const char *)encoded);
    if (strlen(input) != len) {
        return 0;
    }
    for (size_t i = 0; i < len; i++) {
        if ((unsigned char)input[i] != (encoded[i] ^ XOR_KEY)) {
            return 0;
        }
    }
    return 1;
}

int main() {
    char buf[64];

    printf("=== Baby Reversing ===\n");
    printf("Enter password: ");

    if (fgets(buf, sizeof(buf), stdin) == NULL) {
        return 1;
    }
    buf[strcspn(buf, "\n")] = '\0';

    if (check_password(buf)) {
        /* Read flag from flag.txt at runtime */
        FILE *fp = fopen("flag.txt", "r");
        if (fp) {
            char flag[128];
            if (fgets(flag, sizeof(flag), fp))
                printf("Correct! Flag: %s\n", flag);
            fclose(fp);
        } else {
            printf("Correct! (flag.txt not found)\n");
        }
    } else {
        printf("Wrong password!\n");
    }

    return 0;
}
