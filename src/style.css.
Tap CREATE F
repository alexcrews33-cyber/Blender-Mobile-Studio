
* {
  box-sizing: border-box;
}

:root {
  font-family: Inter, system-ui, Arial, sans-serif;
  color: #f4f6fb;
  background: #10131b;
  font-synthesis: none;
}

html,
body,
#root {
  min-width: 320px;
  min-height: 100%;
  margin: 0;
}

body {
  min-height: 100vh;
}

button,
input {
  font: inherit;
}

button {
  cursor: pointer;
}

.studio {
  min-height: 100vh;
  padding: 20px;
  background: #10131b;
}

.topbar,
.topbar > div,
.workspace,
.preview-footer,
.color-row,
.slider-row,
.footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.topbar {
  margin-bottom: 20px;
}

.topbar > div {
  justify-content: flex-start;
}

.brand-icon {
  color: #83a8ff;
  font-size: 30px;
}

h1,
h2,
p {
  margin-top: 0;
}

h1 {
  margin-bottom: 4px;
  font-size: 26px;
}

.topbar p,
.subtext {
  margin-bottom: 0;
  color: #9ba6bb;
}

.status {
  color: #a9e8c2;
  font-size: 13px;
}

.workspace {
  align-items: stretch;
  gap: 20px;
}

.viewport {
  position: relative;
  flex: 1 1 0;
  min-width: 0;
  min-height: 480px;
  overflow: hidden;
  border: 1px solid #30394b;
  border-radius: 18px;
  background: #151923;
}

.viewport canvas {
  display: block;
  width: 100%;
  height: 480px;
}

.viewport-label,
.preview-footer {
  position: absolute;
  z-index: 1;
  right: 14px;
  left: 14px;
  color: #dce4f5;
  font-size: 12px;
}

.viewport-label {
  top: 14px;
  display: flex;
  justify-content: space-between;
  pointer-events: none;
}

.preview-footer {
  bottom: 14px;
}

.preview-footer button {
  padding: 8px 12px;
  border: 1px solid #46516a;
  border-radius: 8px;
  color: #fff;
  background: #252d3d;
}

.controls {
  flex: 0 0 300px;
  width: 300px;
  padding: 20px;
  border: 1px solid #30394b;
  border-radius: 18px;
  background: #191e29;
}

.controls h2 {
  margin-bottom: 8px;
  font-size: 22px;
}

.subtext {
  margin-bottom: 24px;
  font-size: 14px;
}

.controls label {
  display: block;
  margin: 18px 0 8px;
  font-size: 14px;
  font-weight: 600;
}

.color-row {
  justify-content: flex-start;
  color: #cbd4e5;
  font-size: 13px;
}

.color-row input[type="color"] {
  width: 48px;
  height: 36px;
  padding: 2px;
  border: 1px solid #46516a;
  border-radius: 8px;
  background: #252d3d;
}

.slider-row {
  justify-content: flex-start;
  color: #cbd4e5;
  font-size: 13px;
}

.slider-row input[type="range"] {
  flex: 1;
  min-width: 0;
  accent-color: #7198ff;
}

.reset {
  width: 100%;
  margin-top: 24px;
  padding: 12px;
  border: 0;
  border-radius: 10px;
  color: #fff;
  background: #4779e8;
  font-weight: 700;
}

.reset:hover {
  background: #5a88f0;
}

.notice {
  margin-top: 20px;
  padding: 14px;
  border: 1px solid #39445a;
  border-radius: 12px;
  color: #c9d2e4;
  background: #202737;
  font-size: 13px;
  line-height: 1.5;
}

.notice strong {
  color: #9ebaff;
}

.notice p {
  margin: 8px 0 0;
}

.footer {
  margin-top: 20px;
  color: #8793a9;
  font-size: 11px;
  letter-spacing: 1px;
}

@media (max-width: 760px) {
  .studio {
    padding: 12px;
  }

  .workspace {
    flex-direction: column;
  }

  .viewport {
    flex: none;
    width: 100%;
    min-height: 380px;
  }

  .viewport canvas {
    height: 380px;
  }

  .controls {
    flex: none;
    width: 100%;
  }

  .status {
    font-size: 11px;
  }

  .footer {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
