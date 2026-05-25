import { useEffect, useRef, useState } from 'react'
import Button from '../ui/Button'

const tools = [
  { label: 'Tiêu đề', command: 'formatBlock', value: 'h2' },
  { label: 'Đậm', command: 'bold' },
  { label: 'Nghiêng', command: 'italic' },
  { label: 'Danh sách', command: 'insertUnorderedList' },
]

function RichTextEditor({ value = '', onChange, error }) {
  const editorRef = useRef(null)
  const [preview, setPreview] = useState(false)

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value
    }
  }, [value])

  function runTool(command, commandValue) {
    editorRef.current?.focus()
    document.execCommand(command, false, commandValue)
    onChange(cleanPreviewHtml(editorRef.current?.innerHTML || ''))
  }

  function addLink() {
    const url = window.prompt('Nhập liên kết (https://...)')
    if (url) runTool('createLink', url)
  }

  return (
    <div className={`overflow-hidden rounded-lg border bg-white ${error ? 'border-danger' : 'border-neutral-300'}`}>
      <div className="flex flex-wrap gap-2 border-b border-neutral-200 bg-neutral-50 p-2">
        {tools.map((tool) => (
          <Button key={tool.label} type="button" size="sm" variant="secondary" onClick={() => runTool(tool.command, tool.value)}>
            {tool.label}
          </Button>
        ))}
        <Button type="button" size="sm" variant="secondary" onClick={addLink}>Liên kết</Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setPreview((current) => !current)}>
          {preview ? 'Soạn thảo' : 'Xem trước'}
        </Button>
      </div>
      {preview ? (
        <div className="prose min-h-40 max-w-none p-4 text-sm" dangerouslySetInnerHTML={{ __html: cleanPreviewHtml(value) }} />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          className="min-h-40 p-4 text-sm text-neutral-800 outline-none"
          onInput={(event) => onChange(cleanPreviewHtml(event.currentTarget.innerHTML))}
        />
      )}
    </div>
  )
}

export default RichTextEditor

function cleanPreviewHtml(html) {
  const documentValue = new globalThis.DOMParser().parseFromString(html, 'text/html')
  documentValue.querySelectorAll('script, style, iframe, object').forEach((element) => element.remove())
  documentValue.body.querySelectorAll('*').forEach((element) => {
    Array.from(element.attributes).forEach((attribute) => {
      if (attribute.name.startsWith('on') || attribute.name === 'style') element.removeAttribute(attribute.name)
      if (attribute.name === 'href' && !/^(https?:|mailto:)/i.test(attribute.value)) element.removeAttribute(attribute.name)
    })
  })
  return documentValue.body.innerHTML
}
