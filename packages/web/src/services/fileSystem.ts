/**
 * File System Access API service for saving/opening .pfs files
 */

// Check if File System Access API is supported
export const isFileSystemAccessSupported = (): boolean => {
  return 'showOpenFilePicker' in window && 'showSaveFilePicker' in window
}

/**
 * Open a .pfs file from the user's file system
 */
export async function openFile(): Promise<{
  content: string
  handle: FileSystemFileHandle
  name: string
} | null> {
  if (!isFileSystemAccessSupported()) {
    alert('File System Access API is not supported in this browser')
    return null
  }

  try {
    const [handle] = await window.showOpenFilePicker({
      types: [
        {
          description: 'Project Flow Syntax Files',
          accept: {
            'text/plain': ['.pfs'],
          },
        },
      ],
      multiple: false,
    })

    const file = await handle.getFile()
    const content = await file.text()

    return {
      content,
      handle,
      name: file.name,
    }
  } catch (error) {
    // User cancelled or error occurred
    if ((error as Error).name !== 'AbortError') {
      console.error('Error opening file:', error)
    }
    return null
  }
}

/**
 * Save content to a new .pfs file
 */
export async function saveAsFile(
  content: string,
  suggestedName = 'project.pfs',
): Promise<FileSystemFileHandle | null> {
  if (!isFileSystemAccessSupported()) {
    // Fallback: download file
    downloadFile(content, suggestedName)
    return null
  }

  try {
    const handle = await window.showSaveFilePicker({
      suggestedName,
      types: [
        {
          description: 'Project Flow Syntax Files',
          accept: {
            'text/plain': ['.pfs'],
          },
        },
      ],
    })

    await writeFile(handle, content)
    return handle
  } catch (error) {
    // User cancelled or error occurred
    if ((error as Error).name !== 'AbortError') {
      console.error('Error saving file:', error)
    }
    return null
  }
}

/**
 * Save content to an existing file handle
 */
export async function saveFile(
  handle: FileSystemFileHandle,
  content: string,
): Promise<boolean> {
  try {
    await writeFile(handle, content)
    return true
  } catch (error) {
    console.error('Error saving to existing file:', error)
    return false
  }
}

/**
 * Write content to a file handle
 */
async function writeFile(
  handle: FileSystemFileHandle,
  content: string,
): Promise<void> {
  const writable = await handle.createWritable()
  await writable.write(content)
  await writable.close()
}

/**
 * Fallback: Download file (for browsers without File System Access API)
 */
function downloadFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
