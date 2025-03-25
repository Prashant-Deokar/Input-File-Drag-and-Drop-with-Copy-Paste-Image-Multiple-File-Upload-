import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'drag-drop-multi-file';
  selectedFiles: File[] = [];
  isDragging = false;
  isHovering = false;
  allowedFileTypes = ['image/jpeg', 'image/png'];
  maxFileSizeMB = 2;
  fileValidationError: string | null = null;

  @ViewChild('fileInput') fileInput!: ElementRef;

  constructor(private toaster: ToastrService) {}

  onFileSelected(event: any) {
    const files: FileList = event.target.files;
    this.validateAndHandleFiles(files);
    this.fileInput.nativeElement.value = '';
  }
  private validateAndHandleFiles(files: FileList) {
    const invalidFiles: string[] = [];
    const oversizedFiles: string[] = [];
    const validFiles: File[] = [];

    Array.from(files).forEach((file) => {
      if (!this.allowedFileTypes.includes(file.type)) {
        invalidFiles.push(file.name);
        return;
      }

      if (file.size > this.maxFileSizeMB * 1024 * 1024) {
        oversizedFiles.push(file.name);
        return;
      }

      if (!this.isFileAlreadySelected(file)) {
        validFiles.push(file);
      }
    });

    if (invalidFiles.length > 0) {
      this.fileValidationError = `Invalid file type: ${invalidFiles.join(
        ', '
      )}. Please upload only JPG or PNG pdf files.`;
      this.toaster.error(this.fileValidationError);
    }

    if (oversizedFiles.length > 0) {
      this.fileValidationError = `${oversizedFiles.join(
        ', '
      )} Please upload a file that is up to 2MB in size.`;
      this.toaster.error(this.fileValidationError);
    }

    if (validFiles.length > 0) {
      this.selectedFiles = [...this.selectedFiles, ...validFiles];
      this.toaster.success(`Added ${validFiles.length} valid file(s)`);
    }
  }

  @HostListener('dragover', ['$event']) onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  @HostListener('dragleave', ['$event']) onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  @HostListener('drop', ['$event']) onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    if (event.dataTransfer?.files) {
      this.validateAndHandleFiles(event.dataTransfer.files);
    }
  }

  @HostListener('window:paste', ['$event'])
  onPaste(event: ClipboardEvent) {
    if (this.isHovering && event.clipboardData?.files.length) {
      const pastedFiles = event.clipboardData.files;
      const dataTransfer = new DataTransfer();
      Array.from(pastedFiles).forEach((file) => dataTransfer.items.add(file));
      this.validateAndHandleFiles(dataTransfer.files);
      event.preventDefault();
    }
  }

  onDropZoneEnter() {
    this.isHovering = true;
  }

  onDropZoneLeave() {
    this.isHovering = false;
  }

  private isFileAlreadySelected(file: File): boolean {
    return this.selectedFiles.some(
      (f) =>
        f.name === file.name &&
        f.size === file.size &&
        f.lastModified === file.lastModified
    );
  }
  removeFile(index: number) {
    this.selectedFiles.splice(index, 1);
    this.toaster.info('File removed');
  }
  uploadFiles() {
    if (this.selectedFiles.length === 0) {
      this.toaster.warning('No files selected for upload');
      return;
    }

    const formData = new FormData();
    this.selectedFiles.forEach((file) => {
      formData.append('files', file, file.name);
    });

    console.log('Files ready for upload:', formData);
    this.toaster.success(`Uploading ${this.selectedFiles.length} files...`);
  }
  clearAllFiles() {
    this.selectedFiles = [];
    this.toaster.info('All files cleared');
  }

  formatSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getFileIcon(file: File): string {
    return file.type.startsWith('image/') ? 'fa-file-image' : 'fa-file';
  }
  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }
}
