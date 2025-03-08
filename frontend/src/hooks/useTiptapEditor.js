import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Box, Button, IconButton } from '@mui/material';
import {
    FormatBold as FormatBoldIcon,
    FormatItalic as FormatItalicIcon,
    FormatUnderlined as FormatUnderlinedIcon,
    Link as LinkIcon,
    Image as ImageIcon,
    Code as CodeIcon,
    CodeOff as CodeOffIcon,
} from '@mui/icons-material';
import styled from '@mui/material/styles/styled';

const StyledEditorWrapper = styled(Box)(({ theme }) => ({
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(1),
    marginBottom: theme.spacing(2),
}));

const StyledEditorControls = styled(Box)(({ theme }) => ({
    marginBottom: theme.spacing(1),
}));

const StyledEditorContent = styled(EditorContent)(({ theme }) => ({
    padding: theme.spacing(1),
    '& p': {
        margin: theme.spacing(0.5, 0),
    },
}));

export const useTiptapEditor = (setEditorContent) => {
    const [isCodeView, setIsCodeView] = useState(false);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Link,
            Image,
        ],
        content: '<p>Hello World!</p>',
        onUpdate: ({ editor }) => {
            setEditorContent(editor.getHTML());
        },
    });

    useEffect(() => {
        if (editor) {
            setEditorContent(editor.getHTML());
        }
    }, [editor, setEditorContent]);

    if (!editor) {
        return { editor: null, Tiptap: null };
    }

    const handleToggleCodeView = () => {
        setIsCodeView(!isCodeView);
    };

    const Tiptap = (
        <StyledEditorWrapper>
            <StyledEditorControls>
                <IconButton onClick={() => editor.chain().focus().toggleBold().run()} disabled={isCodeView}>
                    <FormatBoldIcon />
                </IconButton>
                <IconButton onClick={() => editor.chain().focus().toggleItalic().run()} disabled={isCodeView}>
                    <FormatItalicIcon />
                </IconButton>
                <IconButton onClick={() => editor.chain().focus().toggleUnderline().run()} disabled={isCodeView}>
                    <FormatUnderlinedIcon />
                </IconButton>
                <IconButton onClick={() => editor.chain().focus().setLink({ href: prompt('URL 주소를 입력해주세요.') }).run()} disabled={isCodeView}>
                    <LinkIcon />
                </IconButton>
                <IconButton onClick={() => editor.chain().focus().setImage({ src: prompt('이미지 URL을 입력해주세요.') }).run()} disabled={isCodeView}>
                    <ImageIcon />
                </IconButton>
                <IconButton onClick={handleToggleCodeView}>
                    {isCodeView ? <CodeOffIcon /> : <CodeIcon />}
                </IconButton>
            </StyledEditorControls>
            {isCodeView ? (
                <textarea
                    value={editor.getHTML()}
                    onChange={(e) => editor.commands.setContent(e.target.value)}
                    style={{ width: '100%', height: '300px' }}
                />
            ) : (
                <StyledEditorContent>
                    <EditorContent editor={editor} />
                </StyledEditorContent>
            )}
        </StyledEditorWrapper>
    );

    return { editor, Tiptap };
};
