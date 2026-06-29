package com.testapp.webview

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Rect
import android.util.AttributeSet
import android.util.Log
import android.view.ActionMode
import android.view.Menu
import android.view.MenuItem
import android.view.View
import android.webkit.WebView

/**
 * A WebView subclass that forces text-selection to use a floating ActionMode
 * (which is the path that produces the draggable selection handles with the
 * magnifier loupe on Android WebView).
 *
 * The two long-press UI artefacts are produced by **two independent layers**:
 *   - The "Select text" item in the long-press context menu is the system
 *     `FloatingToolbar` driven by `ActionMode.TYPE_PRIMARY`.
 *   - The draggable bars with the magnifier loupe are drawn by chromium's
 *     native `PopupTouchHandleDrawable` overlay, which is keyed off the
 *     renderer-side selection state.
 *
 * Forcing `TYPE_FLOATING` does NOT directly draw the magnifier loupe — that
 * is chromium-native — but it keeps the framework out of the way and is the
 * safest combination for "highlight appears, no handles" symptoms. The CSS
 * scoping in the page (`user-select: text` on the bubble leaves) is the
 * other half of the fix; without it, chromium has no selection to render
 * handles for in the first place.
 */
class SelectionWebView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : WebView(context, attrs, defStyleAttr) {

    var onSelectionActionMode: ((ActionMode) -> Unit)? = null

    @SuppressLint("WrongConstant")
    override fun startActionMode(callback: ActionMode.Callback?): ActionMode? {
        val am = super.startActionMode(callback) ?: return null
        Log.d(TAG, "startActionMode(cb) type=${am.type}")
        onSelectionActionMode?.invoke(am)
        return am
    }

    @SuppressLint("WrongConstant")
    override fun startActionMode(callback: ActionMode.Callback?, type: Int): ActionMode? {
        // If the framework handed us TYPE_PRIMARY, force TYPE_FLOATING. This is
        // the documented entry point for showing a floating toolbar anchored
        // to the selection — and on many devices (incl. some Huawei builds)
        // it is also the path that keeps the chromium handles layer happy.
        val requestedType = if (type == ActionMode.TYPE_PRIMARY) ActionMode.TYPE_FLOATING else type
        val am = super.startActionMode(callback, requestedType) ?: return null

        // Best-effort post-hoc type mutation (API 23+). No-op on older API levels.
        if (am.type != ActionMode.TYPE_FLOATING) {
            try {
                am.setType(ActionMode.TYPE_FLOATING)
            } catch (_: Throwable) {
                // Some OEM WebView implementations forbid setType; ignore.
            }
        }

        Log.d(TAG, "startActionMode(cb, type=$type -> ${am.type})")
        onSelectionActionMode?.invoke(am)
        return am
    }

    /**
     * Host selection in a custom Callback2 if ever needed. Not used by the
     * default flow (the WebView creates its own ActionMode for us), but
     * available for tests / debugging.
     */
    fun startFloatingSelectionActionMode(): ActionMode? {
        val cb = object : ActionMode.Callback2() {
            override fun onCreateActionMode(mode: ActionMode, menu: Menu): Boolean = true
            override fun onPrepareActionMode(mode: ActionMode, menu: Menu): Boolean = false
            override fun onActionItemClicked(mode: ActionMode, item: MenuItem): Boolean = false
            override fun onDestroyActionMode(mode: ActionMode) {}
            override fun onGetContentRect(mode: ActionMode?, view: View?, outRect: Rect?) {
                outRect?.set(left, top, right, bottom)
            }
        }
        return startActionMode(cb, ActionMode.TYPE_FLOATING)
    }

    companion object {
        private const val TAG = "SelectionWebView"
    }
}
