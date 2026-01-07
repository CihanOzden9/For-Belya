# Project Changelog

## 2026-01-07
- **Initial Release**: Created React Native Expo app ("Belya's World").
- **UI Design**: Implemented "Candy Theme" with vivid colors (Orange, Green, Blue) and 3D toy-like buttons.
- **Animation**: Added "Pop" animations using `Animated` API (switched from Moti/Reanimated for stability).
- **Navigation**: Implemented `react-navigation` stack for Home, Numbers, and Alphabet screens.
- **Numbers Logic**: Added basic Grid (0-9) and simple Random Game modes.
- **Game Enhancements**:
    - **Menus**: Added Main Menu to Numbers Screen (Learn, Game, Math).
    - **Difficulty**: Added Easy (0-9) and Hard (10-20) modes.
    - **Feedback**: Implemented Visual (Red/Green) and Haptic (Vibration) feedback.
    - **Advanced Mechanics**:
        - **Timer**: Added countdown (45s Easy / 30s Hard).
        - **Scoring**: Persistent High Score + Score tracking with penalties.
        - **Penalty**: Wrong answer shakes screen, hides question, deducts point.
        - **Hint**: Reveal answer option (costs point).
        - **Celebration**: Confetti for new high scores.
    - **Gameplay Balancing**:
        - **Result Screen**: Themed buttons for Restart/Menu.
        - **Logic Fixes**: Score Floor (Min 0), Hints cost point but award 0 on correct answer, Re-appearing question prompt.
        - **Visual Feedback**: Added thick Red Border and Shake animation for wrong answers with 2s reset timer.
