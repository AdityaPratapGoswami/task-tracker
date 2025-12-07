---
description: How to install and start MongoDB on macOS
---

1.  **Check for Homebrew**: Ensure you have Homebrew installed.
    ```bash
    brew --version
    ```

2.  **Tap the MongoDB Formula**:
    ```bash
    brew tap mongodb/brew
    ```

3.  **Install MongoDB**:
    ```bash
    brew install mongodb-community@8.0
    ```
    *(Note: You can replace `@8.0` with other versions if needed)*

4.  **Start MongoDB Service**:
    ```bash
    brew services start mongodb/brew/mongodb-community
    ```

5.  **Verify it's running**:
    ```bash
    brew services list
    ```
    You should see `mongodb-community` with status `started`.
