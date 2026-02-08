"use client"
import { useCallback, useEffect, useRef, useState } from 'react';

const RichTextEditor = ({ 
    value, 
    onChange, 
    placeholder = "Start typing...",
    readOnly = false,
    minHeight = '200px',
    maxHeight = '400px'
}) => {
    const editorRef = useRef(null);
    const [showLinkInput, setShowLinkInput] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [linkText, setLinkText] = useState('');
    const [activeFormats, setActiveFormats] = useState({
        bold: false,
        italic: false,
        underline: false,
        list: false,
        orderedList: false
    });
    const [wordCount, setWordCount] = useState(0);
    const [charCount, setCharCount] = useState(0);

    // Initialize content and update format states
    useEffect(() => {
        if (editorRef.current && value && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value;
            updateCounts();
        }
    }, [value]);

    // Check active formats on selection change
    useEffect(() => {
        const handleSelectionChange = () => {
            if (!editorRef.current) return;
            
            const selection = window.getSelection();
            if (!selection.rangeCount) return;
            
            const range = selection.getRangeAt(0);
            const parentElement = range.commonAncestorContainer.parentElement;
            
            setActiveFormats({
                bold: document.queryCommandState('bold'),
                italic: document.queryCommandState('italic'),
                underline: document.queryCommandState('underline'),
                list: parentElement?.tagName === 'UL' || parentElement?.closest('ul'),
                orderedList: parentElement?.tagName === 'OL' || parentElement?.closest('ol')
            });
        };

        document.addEventListener('selectionchange', handleSelectionChange);
        return () => document.removeEventListener('selectionchange', handleSelectionChange);
    }, []);

    const updateCounts = useCallback(() => {
        if (!editorRef.current) return;
        
        const text = editorRef.current.innerText || '';
        const words = text.trim().split(/\s+/).filter(word => word.length > 0);
        setWordCount(words.length);
        setCharCount(text.length);
    }, []);

    const updateContent = useCallback(() => {
        if (editorRef.current) {
            const content = editorRef.current.innerHTML;
            onChange(content);
            updateCounts();
        }
    }, [onChange, updateCounts]);

    const handleFormat = (command, value = null) => {
        editorRef.current.focus();
        document.execCommand(command, false, value);
        updateContent();
    };

    const handleHeading = (level) => {
        editorRef.current.focus();
        document.execCommand('formatBlock', false, `h${level}`);
        updateContent();
    };

    const handleAlign = (alignment) => {
        editorRef.current.focus();
        document.execCommand('justify' + alignment.charAt(0).toUpperCase() + alignment.slice(1));
        updateContent();
    };

    const handleAddLink = () => {
        if (!linkUrl.trim()) {
            alert('Please enter a URL');
            return;
        }

        try {
            const url = new URL(linkUrl);
            if (!url.protocol.startsWith('http')) {
                throw new Error('Invalid protocol');
            }
        } catch {
            alert('Please enter a valid URL starting with http:// or https://');
            return;
        }

        editorRef.current.focus();
        
        const selection = window.getSelection();
        const selectedText = selection.toString();
        
        const displayText = selectedText || linkText || linkUrl;
        
        // Create link with proper styling
        const link = document.createElement('a');
        link.href = linkUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = displayText;
        link.className = 'rich-text-link';
        
        if (selection.rangeCount > 0 && !selection.isCollapsed) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(link);
            
            const newRange = document.createRange();
            newRange.setStartAfter(link);
            newRange.setEndAfter(link);
            selection.removeAllRanges();
            selection.addRange(newRange);
            
            // Add space after link
            const space = document.createTextNode(' ');
            newRange.insertNode(space);
        } else {
            // Insert at cursor position
            document.execCommand('insertHTML', false, 
                `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer" class="rich-text-link">${displayText}</a>&nbsp;`
            );
        }
        
        updateContent();
        setShowLinkInput(false);
        setLinkUrl('');
        setLinkText('');
    };

    const handlePaste = (e) => {
        e.preventDefault();
        
        const html = e.clipboardData.getData('text/html');
        const text = e.clipboardData.getData('text/plain');
        
        if (html) {
            // Strip unwanted formatting but preserve basic structure
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            
            // Remove scripts, styles, and other unwanted tags
            const scripts = tempDiv.querySelectorAll('script, style, meta, link');
            scripts.forEach(el => el.remove());
            
            // Keep only allowed tags
            const allowedTags = ['p', 'br', 'b', 'strong', 'i', 'em', 'u', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
            tempDiv.querySelectorAll('*').forEach(el => {
                if (!allowedTags.includes(el.tagName.toLowerCase())) {
                    el.replaceWith(...el.childNodes);
                }
            });
            
            const cleanHtml = tempDiv.innerHTML;
            
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                range.deleteContents();
                
                const tempDiv2 = document.createElement('div');
                tempDiv2.innerHTML = cleanHtml;
                const fragment = document.createDocumentFragment();
                while (tempDiv2.firstChild) {
                    fragment.appendChild(tempDiv2.firstChild);
                }
                
                range.insertNode(fragment);
                
                // Move cursor to end
                range.setStartAfter(fragment.lastChild || fragment);
                range.setEndAfter(fragment.lastChild || fragment);
                selection.removeAllRanges();
                selection.addRange(range);
            }
        } else {
            // Plain text fallback
            document.execCommand('insertText', false, text);
        }
        
        updateContent();
    };

    const handleClearFormatting = () => {
        editorRef.current.focus();
        document.execCommand('removeFormat', false, null);
        document.execCommand('unlink', false, null);
        
        // Also remove any inline styles
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const parent = range.commonAncestorContainer.parentElement;
            if (parent && parent.style) {
                parent.removeAttribute('style');
            }
        }
        
        updateContent();
    };

    const handleKeyDown = (e) => {
        // Handle Enter key in lists
        if (e.key === 'Enter') {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const listItem = range.startContainer.parentElement?.closest('li');
                
                if (listItem && listItem.textContent.trim() === '') {
                    e.preventDefault();
                    document.execCommand('outdent', false, null);
                }
            }
        }
        
        // Ctrl+B for bold
        if (e.ctrlKey && e.key === 'b') {
            e.preventDefault();
            handleFormat('bold');
        }
        
        // Ctrl+I for italic
        if (e.ctrlKey && e.key === 'i') {
            e.preventDefault();
            handleFormat('italic');
        }
        
        // Ctrl+K for link
        if (e.ctrlKey && e.key === 'k') {
            e.preventDefault();
            setShowLinkInput(true);
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }
        
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            alert('Image size should be less than 5MB');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = document.createElement('img');
            img.src = event.target.result;
            img.alt = 'Uploaded image';
            img.className = 'rich-text-image';
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
            img.style.borderRadius = '4px';
            img.style.margin = '8px 0';
            
            editorRef.current.focus();
            document.execCommand('insertHTML', false, img.outerHTML);
            updateContent();
        };
        reader.readAsDataURL(file);
        
        // Reset file input
        e.target.value = '';
    };

    const insertHorizontalRule = () => {
        editorRef.current.focus();
        document.execCommand('insertHorizontalRule', false, null);
        updateContent();
    };

    const handleUndo = () => {
        editorRef.current.focus();
        document.execCommand('undo', false, null);
        updateContent();
    };

    const handleRedo = () => {
        editorRef.current.focus();
        document.execCommand('redo', false, null);
        updateContent();
    };

    return (
        <div className="rich-text-editor w-full">
            {/* Toolbar */}
            <div className="toolbar flex flex-wrap items-center gap-1 sm:gap-2 p-2 sm:p-3 bg-gray-50 border border-gray-300 rounded-t-lg shadow-sm">
                {/* History */}
                <div className="flex items-center gap-1 mr-1">
                    <button
                        type="button"
                        onClick={handleUndo}
                        className="p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                        title="Undo (Ctrl+Z)"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6-6m-6 6l6 6" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        onClick={handleRedo}
                        className="p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                        title="Redo (Ctrl+Y)"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </button>
                </div>

                <div className="w-px h-6 bg-gray-300"></div>

                {/* Text Formatting */}
                <button
                    type="button"
                    onClick={() => handleFormat('bold')}
                    className={`p-2 border rounded transition-colors ${activeFormats.bold ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-white border-gray-300 hover:bg-gray-50'}`}
                    title="Bold (Ctrl+B)"
                >
                    <strong className="font-bold">B</strong>
                </button>
                
                <button
                    type="button"
                    onClick={() => handleFormat('italic')}
                    className={`p-2 border rounded transition-colors ${activeFormats.italic ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-white border-gray-300 hover:bg-gray-50'}`}
                    title="Italic (Ctrl+I)"
                >
                    <em className="italic">I</em>
                </button>
                
                <button
                    type="button"
                    onClick={() => handleFormat('underline')}
                    className={`p-2 border rounded transition-colors ${activeFormats.underline ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-white border-gray-300 hover:bg-gray-50'}`}
                    title="Underline"
                >
                    <u className="underline">U</u>
                </button>

                <div className="w-px h-6 bg-gray-300"></div>

                {/* Headings */}
                <div className="relative group">
                    <button
                        type="button"
                        className="p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors flex items-center gap-1"
                        title="Headings"
                    >
                        <span className="font-semibold">H</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    <div className="absolute hidden group-hover:flex flex-col bg-white border border-gray-300 rounded shadow-lg z-10 mt-1">
                        {[1, 2, 3, 4, 5, 6].map(level => (
                            <button
                                key={level}
                                type="button"
                                onClick={() => handleHeading(level)}
                                className="px-3 py-2 hover:bg-gray-100 text-left whitespace-nowrap"
                            >
                                Heading {level}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Alignment */}
                <div className="relative group">
                    <button
                        type="button"
                        className="p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                        title="Text Alignment"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <div className="absolute hidden group-hover:flex bg-white border border-gray-300 rounded shadow-lg z-10 mt-1">
                        {['left', 'center', 'right', 'justify'].map(align => (
                            <button
                                key={align}
                                type="button"
                                onClick={() => handleAlign(align)}
                                className="p-2 hover:bg-gray-100"
                                title={`Align ${align}`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {align === 'left' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />}
                                    {align === 'center' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M8 12h8M4 18h16" />}
                                    {align === 'right' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M11 18h9" />}
                                    {align === 'justify' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
                                </svg>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="w-px h-6 bg-gray-300"></div>

                {/* Lists */}
                <button
                    type="button"
                    onClick={() => handleFormat('insertUnorderedList')}
                    className={`p-2 border rounded transition-colors ${activeFormats.list ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-white border-gray-300 hover:bg-gray-50'}`}
                    title="Bullet List"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
                
                <button
                    type="button"
                    onClick={() => handleFormat('insertOrderedList')}
                    className={`p-2 border rounded transition-colors ${activeFormats.orderedList ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-white border-gray-300 hover:bg-gray-50'}`}
                    title="Numbered List"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                </button>

                <div className="w-px h-6 bg-gray-300"></div>

                {/* Link */}
                <button
                    type="button"
                    onClick={() => setShowLinkInput(!showLinkInput)}
                    className={`p-2 border rounded transition-colors ${showLinkInput ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-white border-gray-300 hover:bg-gray-50'}`}
                    title="Add Link (Ctrl+K)"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                </button>

                {/* Image Upload */}
                <label className="p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors cursor-pointer">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                    />
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" title="Insert Image">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </label>

                {/* Horizontal Rule */}
                <button
                    type="button"
                    onClick={insertHorizontalRule}
                    className="p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    title="Insert Horizontal Line"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 12H5" />
                    </svg>
                </button>

                <div className="w-px h-6 bg-gray-300"></div>

                {/* Clear Formatting */}
                <button
                    type="button"
                    onClick={handleClearFormatting}
                    className="p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    title="Clear All Formatting"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>

            {/* Link Input Modal */}
            {showLinkInput && (
                <div className="link-input p-4 bg-white border border-gray-300 border-t-0 shadow-sm">
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                URL <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="url"
                                placeholder="https://example.com"
                                value={linkUrl}
                                onChange={(e) => setLinkUrl(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Display Text (Optional)
                            </label>
                            <input
                                type="text"
                                placeholder="Click here"
                                value={linkText}
                                onChange={(e) => setLinkText(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Leave empty to use selected text or URL
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={handleAddLink}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                            >
                                Insert Link
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowLinkInput(false);
                                    setLinkUrl('');
                                    setLinkText('');
                                }}
                                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Editor Area */}
            <div
                ref={editorRef}
                contentEditable={!readOnly}
                suppressContentEditableWarning
                onInput={updateContent}
                onPaste={handlePaste}
                onKeyDown={handleKeyDown}
                className={`editor p-4 border border-gray-300 border-t-0 rounded-b-lg focus:outline-none focus:ring-2 focus:ring-blue-500 overflow-y-auto bg-white ${readOnly ? 'bg-gray-50' : ''}`}
                style={{ 
                    minHeight,
                    maxHeight,
                }}
                data-placeholder={placeholder}
            />
            
            {/* Stats Bar */}
            <div className="stats-bar flex justify-between items-center px-3 py-2 bg-gray-50 border border-gray-300 border-t-0 text-xs text-gray-500">
                <div className="flex gap-4">
                    <span>Words: {wordCount}</span>
                    <span>Characters: {charCount}</span>
                </div>
                <div className="flex gap-2">
                    <span className="hidden sm:inline">Shortcuts: Ctrl+B, Ctrl+I, Ctrl+K</span>
                </div>
            </div>
            
            {/* Inline Styles */}
            <style>{`
                .rich-text-editor {
                    width: 100%;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                }
                
                .editor:empty:before {
                    content: attr(data-placeholder);
                    color: #9ca3af;
                    pointer-events: none;
                    font-style: italic;
                }
                
                .editor {
                    line-height: 1.6;
                    text-align: left;
                    direction: ltr;
                }
                
                .editor:focus {
                    outline: none;
                }
                
                .editor p {
                    margin: 0 0 12px 0;
                    min-height: 1.2em;
                }
                
                .editor h1, .editor h2, .editor h3, .editor h4, .editor h5, .editor h6 {
                    margin: 16px 0 8px 0;
                    font-weight: 600;
                    line-height: 1.3;
                }
                
                .editor h1 { font-size: 2em; }
                .editor h2 { font-size: 1.5em; }
                .editor h3 { font-size: 1.17em; }
                .editor h4 { font-size: 1em; }
                .editor h5 { font-size: 0.83em; }
                .editor h6 { font-size: 0.67em; }
                
                .editor ul,
                .editor ol {
                    margin: 12px 0;
                    padding-left: 32px;
                }
                
                .editor li {
                    margin: 4px 0;
                    padding-left: 4px;
                }
                
                .editor ul {
                    list-style-type: disc;
                }
                
                .editor ol {
                    list-style-type: decimal;
                }
                
                .editor a.rich-text-link {
                    color: #2563eb;
                    text-decoration: none;
                    border-bottom: 1px solid #2563eb;
                    transition: all 0.2s;
                }
                
                .editor a.rich-text-link:hover {
                    color: #1d4ed8;
                    border-bottom: 2px solid #1d4ed8;
                }
                
                .editor img.rich-text-image {
                    display: block;
                    max-width: 100%;
                    height: auto;
                    border-radius: 6px;
                    margin: 12px 0;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }
                
                .editor hr {
                    border: none;
                    border-top: 1px solid #e5e7eb;
                    margin: 16px 0;
                }
                
                .editor blockquote {
                    border-left: 4px solid #e5e7eb;
                    margin: 16px 0;
                    padding-left: 16px;
                    color: #6b7280;
                    font-style: italic;
                }
                
                .editor pre {
                    background: #f3f4f6;
                    padding: 12px;
                    border-radius: 6px;
                    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                    overflow-x: auto;
                    margin: 12px 0;
                }
                
                .editor code {
                    background: #f3f4f6;
                    padding: 2px 4px;
                    border-radius: 4px;
                    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                    font-size: 0.9em;
                }
                
                .toolbar button:active {
                    transform: translateY(1px);
                }
                
                /* Responsive design */
                @media (max-width: 768px) {
                    .toolbar {
                        padding: 8px;
                        gap: 4px;
                    }
                    
                    .toolbar button {
                        padding: 6px;
                    }
                    
                    .editor {
                        padding: 12px;
                        min-height: 150px;
                    }
                    
                    .stats-bar {
                        flex-direction: column;
                        gap: 4px;
                        align-items: flex-start;
                    }
                }
                
                @media (max-width: 480px) {
                    .toolbar {
                        overflow-x: auto;
                        flex-wrap: nowrap;
                    }
                    
                    .toolbar > * {
                        flex-shrink: 0;
                    }
                }
            `}</style>
        </div>
    );
};

export default RichTextEditor;