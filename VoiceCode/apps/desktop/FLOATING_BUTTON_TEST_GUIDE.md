# 🎯 Floating Dictation Button - Test Guide

## 📍 **WHERE TO FIND IT**

The floating button should be visible in the **bottom-right corner** of the app window.

**Look for:**
- 🔵 **Blue circular button** with microphone icon (when idle)
- 🔴 **Red circular button** with pulsing animation (when recording)
- **Size:** Medium (48px diameter)
- **Position:** Bottom-right, 20px from edges

---

## ✨ **FEATURES TO TEST**

### **1. Basic Click Functionality**
- **Click once** → Starts dictation (button turns red)
- **Click again** → Stops dictation (button turns blue)

### **2. Visual States**
- **Idle:** Blue gradient background
- **Recording:** Red gradient with pulsing ring animation
- **Hover:** Scales up slightly (1.05x)
- **Active:** Scales down (0.95x)

### **3. Recording Timer**
- **When recording:** Timer appears above button
- **Format:** "0:00" → "0:01" → "0:02" etc.
- **Updates:** Every second

### **4. Keyboard Shortcut**
- **Shortcut:** Ctrl + Shift + V
- **Hint:** Shows "Ctrl + Shift + V" below button when hovering

### **5. Drag & Drop**
- **Drag:** Click and hold, then move mouse
- **Drop:** Release to place button anywhere
- **Custom position:** Button stays where you drop it

### **6. Long Press Menu**
- **Long press:** Hold button for 500ms
- **Menu appears:** Shows voice commands
  - Insert
  - Format
  - Undo
  - Settings
  - Close

### **7. Accessibility**
- **Tab focus:** Button can be focused with Tab key
- **Focus indicator:** Blue outline when focused
- **ARIA labels:** "Start Dictation" / "Stop Dictation"
- **Keyboard activation:** Enter or Space to activate

---

## 🧪 **TEST CASES**

### **TC-FB-1: Basic Start/Stop**
**Steps:**
1. Look at bottom-right corner of app
2. Click the blue floating button
3. Speak: "Testing the floating button"
4. Click the red button to stop

**Expected Results:**
- ✅ Button turns red when recording starts
- ✅ Pulsing ring animation appears
- ✅ Timer shows above button (0:00, 0:01, 0:02...)
- ✅ Text appears in editor
- ✅ Button turns blue when recording stops
- ✅ Timer disappears

---

### **TC-FB-2: Hover Effects**
**Steps:**
1. Hover mouse over floating button
2. Observe visual changes
3. Move mouse away

**Expected Results:**
- ✅ Button scales up slightly (1.05x)
- ✅ Shadow becomes more prominent
- ✅ Keyboard hint "Ctrl + Shift + V" appears below button
- ✅ Tooltip "Start Dictation" appears above button
- ✅ Effects reverse when mouse leaves

---

### **TC-FB-3: Recording Timer**
**Steps:**
1. Click floating button to start recording
2. Wait 10 seconds
3. Observe timer

**Expected Results:**
- ✅ Timer appears immediately above button
- ✅ Shows "0:00" at start
- ✅ Updates every second: "0:01", "0:02", "0:03"...
- ✅ Reaches "0:10" after 10 seconds
- ✅ Timer disappears when recording stops

---

### **TC-FB-4: Keyboard Shortcut**
**Steps:**
1. Press Ctrl + Shift + V
2. Speak: "Testing keyboard shortcut"
3. Press Ctrl + Shift + V again

**Expected Results:**
- ✅ Recording starts (button turns red)
- ✅ Text is transcribed
- ✅ Recording stops (button turns blue)
- ✅ Same behavior as clicking button

---

### **TC-FB-5: Drag & Drop**
**Steps:**
1. Click and hold floating button
2. Drag to top-left corner
3. Release mouse
4. Try dragging to center of screen
5. Try dragging to bottom-left corner

**Expected Results:**
- ✅ Button becomes semi-transparent (0.8 opacity) while dragging
- ✅ Cursor changes to "grabbing"
- ✅ Button follows mouse cursor
- ✅ Button stays at dropped position
- ✅ Can be dragged to any position on screen
- ✅ Dragging does NOT trigger recording

---

### **TC-FB-6: Long Press Menu**
**Steps:**
1. Click and hold floating button for 1 second
2. Don't move mouse (no dragging)
3. Observe menu appearance
4. Click "Insert" menu item
5. Long press again
6. Click "Close" button

**Expected Results:**
- ✅ Menu appears after 500ms hold
- ✅ Menu shows above button (if bottom position)
- ✅ Menu contains: Insert, Format, Undo, Settings, Close
- ✅ Menu items are clickable
- ✅ Menu closes when item is clicked
- ✅ Menu closes when "Close" is clicked
- ✅ Long press does NOT trigger recording

---

### **TC-FB-7: Accessibility - Keyboard Navigation**
**Steps:**
1. Press Tab key multiple times until floating button is focused
2. Observe focus indicator
3. Press Enter key
4. Speak: "Testing keyboard navigation"
5. Press Space key

**Expected Results:**
- ✅ Button receives focus (blue outline)
- ✅ Focus indicator is clearly visible
- ✅ Enter key starts recording
- ✅ Text is transcribed
- ✅ Space key stops recording

---

### **TC-FB-8: Multiple Recording Sessions**
**Steps:**
1. Click floating button → Record 5 seconds → Stop
2. Click floating button → Record 5 seconds → Stop
3. Click floating button → Record 5 seconds → Stop
4. Repeat 5 times total

**Expected Results:**
- ✅ Each session starts/stops correctly
- ✅ Timer resets to 0:00 each time
- ✅ All transcripts appear in editor
- ✅ No performance degradation
- ✅ No memory leaks
- ✅ Button remains responsive

---

### **TC-FB-9: Recording While Typing**
**Steps:**
1. Click in the main editor
2. Type: "This is typed text. "
3. Click floating button to start recording
4. Speak: "This is spoken text."
5. Stop recording
6. Type: " This is more typed text."

**Expected Results:**
- ✅ Can type while button is visible
- ✅ Recording starts without interrupting typing
- ✅ Spoken text is appended to typed text
- ✅ Can continue typing after recording
- ✅ All text appears in correct order

---

### **TC-FB-10: Button Visibility**
**Steps:**
1. Resize app window to very small
2. Resize app window to very large
3. Minimize and restore app
4. Switch to another app and back

**Expected Results:**
- ✅ Button remains visible at all window sizes
- ✅ Button position adjusts appropriately
- ✅ Button doesn't overlap important UI elements
- ✅ Button persists after minimize/restore
- ✅ Button remains functional after app switching

---

## 🎨 **VISUAL CHECKLIST**

### **Idle State (Not Recording):**
- [ ] Blue gradient background (#0078D4 → #005A9E)
- [ ] White microphone icon
- [ ] White border (semi-transparent)
- [ ] Subtle shadow
- [ ] 48px diameter (medium size)

### **Recording State:**
- [ ] Red gradient background (#D83B01 → #A52A00)
- [ ] White microphone icon
- [ ] Pulsing ring animation (red, expanding)
- [ ] Timer above button (black background, white text)
- [ ] Glowing shadow effect

### **Hover State:**
- [ ] Darker gradient
- [ ] Larger shadow
- [ ] Scales up to 1.05x
- [ ] Keyboard hint appears below
- [ ] Tooltip appears above

### **Dragging State:**
- [ ] 80% opacity
- [ ] "Grabbing" cursor
- [ ] Larger shadow
- [ ] Follows mouse cursor

---

## 🐛 **COMMON ISSUES & FIXES**

### **Issue: Button not visible**
**Possible causes:**
- Button is enabled but positioned off-screen
- Button is hidden behind other elements
- `showFloatingButton` state is false

**Fix:**
- Check App.tsx line 107: `setShowFloatingButton(true)`
- Try dragging from bottom-right corner
- Restart app

### **Issue: Button doesn't respond to clicks**
**Possible causes:**
- Button is in dragging state
- Another element is capturing clicks
- Recording is already active

**Fix:**
- Wait 100ms after dragging
- Click directly on button center
- Check if recording is already active

### **Issue: Timer doesn't appear**
**Possible causes:**
- `showTimer` prop is false
- Timer is positioned off-screen

**Fix:**
- Check App.tsx line 909: `showTimer={true}`
- Ensure button is not at top edge of screen

### **Issue: Keyboard shortcut doesn't work**
**Possible causes:**
- App doesn't have focus
- Another app is capturing the shortcut
- Keyboard event listener not registered

**Fix:**
- Click inside app window first
- Close other apps that might use Ctrl+Shift+V
- Restart app

---

## 📊 **TEST RESULTS TRACKING**

| Test Case | Status | Notes |
|-----------|--------|-------|
| TC-FB-1: Basic Start/Stop | ⏳ | |
| TC-FB-2: Hover Effects | ⏳ | |
| TC-FB-3: Recording Timer | ⏳ | |
| TC-FB-4: Keyboard Shortcut | ⏳ | |
| TC-FB-5: Drag & Drop | ⏳ | |
| TC-FB-6: Long Press Menu | ⏳ | |
| TC-FB-7: Accessibility | ⏳ | |
| TC-FB-8: Multiple Sessions | ⏳ | |
| TC-FB-9: Recording While Typing | ⏳ | |
| TC-FB-10: Button Visibility | ⏳ | |

**Legend:** ⏳ Not Started | 🔄 In Progress | ✅ Passed | ❌ Failed

---

## 🎯 **QUICK TEST (2 Minutes)**

1. **Look** at bottom-right corner → See blue button? ✅
2. **Click** button → Turns red? ✅
3. **Speak** "Hello world" → Text appears? ✅
4. **Click** button again → Turns blue? ✅
5. **Hover** over button → Scales up? ✅
6. **Drag** button to new position → Moves? ✅

**All 6 checks passed?** → Floating button is working! 🎉

---

## 🚀 **NEXT STEPS**

After testing the floating button:
1. Document any issues found
2. Test AI Features Panel (see QUICK_TEST_GUIDE.md)
3. Complete Phase 1 testing (all 24 test cases)
4. Move to Phase 2: Theme Switcher

---

## 📝 **NOTES**

- Floating button is a **desktop-only feature** (not in web/mobile)
- Button uses **browser Speech Recognition API** (not WebSocket)
- Button is **always visible** (can't be hidden by user currently)
- Button **position persists** during session (resets on app restart)
- Long press menu is **placeholder** (actions not fully implemented yet)

