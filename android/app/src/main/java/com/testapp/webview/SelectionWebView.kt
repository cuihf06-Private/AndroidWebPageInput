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
 * WebView that fully suppresses the system text-selection UI
 * (the floating "复制/分享/全选/翻译" toolbar) so the page can
 * own the long-press → custom-menu → "选择文字" → custom-handles
 * flow entirely in CSS+JS.
 *
 * Two suppression paths are layered for redundancy:
 *
 *   1. setOnLongClickListener returns true — consumes the
 *      long-click at the View framework level, so the WebView
 *      never enters its internal select-on-longpress path. This
 *      prevents `startActionMode` from being called in the
 *      long-press case.
 *
 *   2. startActionMode is overridden to return null — this catches
 *      the *programmatic* selection case (e.g. when our JS calls
 *      `addRange` after the user picks "选择文字" from the custom
 *      menu). Without this, the system toolbar would pop up at
 *      that moment too.
 *
 * The page-side counterpart is `document.addEventListener('selectstart', e => e.preventDefault())`
 * — a third layer of defense in case the WebView still tries to
 * start a text selection on long-press despite (1).
 */
class SelectionWebView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : WebView(context, attrs, defStyleAttr) {

    init {
        // (1) Consume long-press at the View framework level. Returning true
        //     tells the framework the long-click is handled, so
        //     View#performLongClick() does NOT call WebView's internal
        //     selectText() path. No selectstart, no startActionMode.
        isLongClickable = true
        setOnLongClickListener { _ -> true }
    }

    // (2) Even if startActionMode *is* called (e.g. by a programmatic
    //     `Selection.addRange` in JS), return null so the framework
    //     does not show its floating toolbar. The selection highlight
    //     still renders — we just own the surrounding UI.
    @SuppressLint("WrongConstant")
    override fun startActionMode(callback: ActionMode.Callback?): ActionMode? {
        Log.d(TAG, "Suppressing startActionMode(cb)")
        return null
    }

    @SuppressLint("WrongConstant")
    override fun startActionMode(callback: ActionMode.Callback?, type: Int): ActionMode? {
        Log.d(TAG, "Suppressing startActionMode(cb, type=$type)")
        return null
    }

    companion object {
        private const val TAG = "SelectionWebView"
    }
}
