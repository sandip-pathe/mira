# Mira UI concepts (Expo / React Native)

An isolated, browser-previewable React Native prototype for comparing three Talk-screen presence directions. It uses the app's installed Expo 57, React Native 0.86, and React Native Web packages; it does not alter the product routes or connect to audio or the backend.

From `mobile/design-prototype`, run:

```powershell
..\node_modules\.bin\expo.cmd start --web --port 8083
```

Open `http://localhost:8083`, choose A, B, or C at the top, then use the Talk controls to move through the same offer → Do → feedback flow. The microphone control only changes the mock screen state.
