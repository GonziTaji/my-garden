package upload

import (
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
)

const uploadsDir = "public/uploads"
const maxImageSize = 28 * 1024 * 1024

var allowedMIMETypes = map[string]bool{
	"image/jpeg": true,
	"image/png":  true,
	"image/webp": true,
}

var allowedExtensions = map[string]bool{
	".jpg":  true,
	".jpeg": true,
	".png":  true,
	".webp": true,
}

type Service struct{}

func NewService() *Service {
	return &Service{}
}

type ValidationError struct {
	Field   string
	Message string
}

func (e *ValidationError) Error() string {
	return e.Message
}

type UploadResult struct {
	Filepath string `json:"filepath"`
}

func (s *Service) GetAllowedMimeTypes() []string {
	keys := []string{}

	for key := range allowedMIMETypes {
		keys = append(keys, key)
	}

	return keys
}

func (s *Service) UploadFile(file *multipart.FileHeader) (*UploadResult, error) {
	ext := strings.ToLower(filepath.Ext(file.Filename))
	if !allowedExtensions[ext] {
		return nil, &ValidationError{
			Field:   "file",
			Message: "Extension de imagen no permitida (usar .jpg, .jpeg, .png o .webp)",
		}
	}

	if file.Size > maxImageSize {
		return nil, &ValidationError{
			Field:   "file",
			Message: "Cada imagen debe pesar maximo 8MB",
		}
	}

	src, err := file.Open()
	if err != nil {
		return nil, fmt.Errorf("open uploaded file: %w", err)
	}
	defer src.Close()

	buf := make([]byte, 512)
	n, _ := io.ReadFull(src, buf)
	mimeType := http.DetectContentType(buf[:n])

	if !strings.HasPrefix(mimeType, "image/") {
		return nil, &ValidationError{
			Field:   "file",
			Message: "Solo se permiten archivos de imagen",
		}
	}
	if !allowedMIMETypes[mimeType] {
		return nil, &ValidationError{
			Field:   "file",
			Message: "Formato de imagen no permitido (usar JPG, PNG o WEBP)",
		}
	}

	if err := os.MkdirAll(uploadsDir, 0755); err != nil {
		return nil, fmt.Errorf("create uploads dir: %w", err)
	}

	filename := fmt.Sprintf("%d-%s%s", time.Now().UnixMilli(), uuid.New().String(), ext)
	targetPath := filepath.Join(uploadsDir, filename)

	out, err := os.Create(targetPath)
	if err != nil {
		return nil, fmt.Errorf("create file: %w", err)
	}
	defer out.Close()

	src.Seek(0, io.SeekStart)
	if _, err := io.Copy(out, src); err != nil {
		return nil, fmt.Errorf("write file: %w", err)
	}

	publicPath := path.Join("/uploads", filename)
	return &UploadResult{Filepath: publicPath}, nil
}

func (s *Service) DeleteFile(fp string) error {
	if strings.Contains(fp, "..") {
		return &ValidationError{Field: "filepath", Message: "Ruta de archivo invalida"}
	}

	relativePath := path.Join(uploadsDir, path.Base(fp))
	return os.Remove(relativePath)
}
