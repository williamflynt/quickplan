// Type definitions for File System Access API
// https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API

interface FileSystemHandle {
  readonly kind: 'file' | 'directory'
  readonly name: string
  isSameEntry(other: FileSystemHandle): Promise<boolean>
}

interface FileSystemFileHandle extends FileSystemHandle {
  readonly kind: 'file'
  getFile(): Promise<File>
  createWritable(
    options?: FileSystemCreateWritableOptions,
  ): Promise<FileSystemWritableFileStream>
}

interface FileSystemDirectoryHandle extends FileSystemHandle {
  readonly kind: 'directory'
}

interface FileSystemWritableFileStream extends WritableStream {
  write(data: string | BufferSource | Blob): Promise<void>
  seek(position: number): Promise<void>
  truncate(size: number): Promise<void>
}

interface FileSystemCreateWritableOptions {
  keepExistingData?: boolean
}

interface FilePickerAcceptType {
  description?: string
  accept: Record<string, string[]>
}

interface OpenFilePickerOptions {
  types?: FilePickerAcceptType[]
  excludeAcceptAllOption?: boolean
  multiple?: boolean
}

interface SaveFilePickerOptions {
  suggestedName?: string
  types?: FilePickerAcceptType[]
  excludeAcceptAllOption?: boolean
}

interface DirectoryPickerOptions {
  mode?: 'read' | 'readwrite'
}

interface Window {
  showOpenFilePicker(
    options?: OpenFilePickerOptions,
  ): Promise<FileSystemFileHandle[]>
  showSaveFilePicker(
    options?: SaveFilePickerOptions,
  ): Promise<FileSystemFileHandle>
  showDirectoryPicker(
    options?: DirectoryPickerOptions,
  ): Promise<FileSystemDirectoryHandle>
}
