"""
Cross-platform desktop notification helper.

Zero external dependencies — uses platform-native APIs:
  Windows  : PowerShell UWP ToastNotification API (Win10+)
  Linux    : notify-send (libnotify)
  macOS    : osascript (fallback via terminal-notifier if available)
  Headless : prints to stderr as a fallback when no display is available
"""

from __future__ import annotations

import os
import platform
import shutil
import subprocess
import sys


def _detect_headless() -> bool:
    """Return True when running without a desktop environment."""
    if platform.system() == "Linux":
        return not os.environ.get("DISPLAY") and not os.environ.get("WAYLAND_DISPLAY")
    if platform.system() == "Windows":
        # No reliable env-var check; try the toast and let it fail silently.
        return False
    return False


def notify(title: str, message: str, sound: bool = True) -> None:
    """Show a desktop notification. Falls back to stderr on headless/unsupported."""
    if _detect_headless():
        print(f"[notify] {title}: {message}", file=sys.stderr)
        return

    system = platform.system()
    try:
        if system == "Windows":
            _notify_windows(title, message, sound)
        elif system == "Linux":
            _notify_linux(title, message)
        elif system == "Darwin":
            _notify_macos(title, message, sound)
        else:
            print(f"[notify] {title}: {message}", file=sys.stderr)
    except Exception:
        # Never crash the caller because of a notification failure
        print(f"[notify] {title}: {message}", file=sys.stderr)


def _notify_windows(title: str, message: str, sound: bool) -> None:
    """PowerShell toast notification (WinRT UWP API, no extra installs)."""
    esc_title = title.replace("'", "''").replace('"', '""')
    esc_msg = message.replace("'", "''").replace('"', '""')
    toast_xml = f'''<?xml version="1.0" encoding="utf-8"?>
<toast{' duration="short"' if not sound else ''}>
  <visual>
    <binding template="ToastText02">
      <text id="1">{esc_title}</text>
      <text id="2">{esc_msg}</text>
    </binding>
  </visual>
</toast>'''
    # Write XML to a temp file to avoid shell quoting issues with multiline
    tmp = os.path.join(os.environ.get("TEMP", os.path.expanduser("~")), "_opencode_toast.xml")
    try:
        with open(tmp, "w", encoding="utf-8") as f:
            f.write(toast_xml)
        ps = (
            f'[Windows.UI.Notifications.ToastNotificationManager, '
            f'Windows.UI.Notifications, ContentType = "WindowsRuntime"] | Out-Null; '
            f'$xml = [Windows.UI.Notifications.ToastNotificationManager]::'
            f'GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02); '
            f'$xml.LoadXml((Get-Content "{tmp}" -Raw)); '
            f'$toast = [Windows.UI.Notifications.ToastNotification]::new($xml); '
            f'[Windows.UI.Notifications.ToastNotificationManager]::'
            f'CreateToastNotifier().Show($toast)'
        )
        subprocess.run(
            ["powershell", "-NoProfile", "-NonInteractive", "-Command", ps],
            capture_output=True, timeout=10,
        )
    finally:
        try:
            os.remove(tmp)
        except OSError:
            pass


def _notify_linux(title: str, message: str) -> None:
    if shutil.which("notify-send"):
        subprocess.run(["notify-send", title, message], capture_output=True, timeout=10)
    else:
        print(f"[notify] {title}: {message}", file=sys.stderr)


def _notify_macos(title: str, message: str, sound: bool) -> None:
    if shutil.which("terminal-notifier"):
        args = ["terminal-notifier", "-title", title, "-message", message]
        if sound:
            args += ["-sound", "default"]
        subprocess.run(args, capture_output=True, timeout=10)
    else:
        subprocess.run(
            ["osascript", "-e",
             f'display notification "{message}" with title "{title}"'],
            capture_output=True, timeout=10,
        )
