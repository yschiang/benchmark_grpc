package main

import (
	"bytes"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
)

func uploadFileHTTP1(filepath string, url string) error {
	// Open the file
	file, err := os.Open(filepath)
	if err != nil {
		return fmt.Errorf("failed to open file: %v", err)
	}
	defer file.Close()

	// Create a multipart writer
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	// Add the file to the multipart request
	part, err := writer.CreateFormFile("file", filepath)
	if err != nil {
		return fmt.Errorf("failed to create form file: %v", err)
	}

	// Copy file content to the multipart part
	_, err = io.Copy(part, file)
	if err != nil {
		return fmt.Errorf("failed to copy file: %v", err)
	}

	// Close the writer to finalize the multipart request
	err = writer.Close()
	if err != nil {
		return fmt.Errorf("failed to close writer: %v", err)
	}

	// Create the HTTP request
	req, err := http.NewRequest("POST", url, body)
	if err != nil {
		return fmt.Errorf("failed to create HTTP request: %v", err)
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	// Send the HTTP request
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send HTTP request: %v", err)
	}
	defer resp.Body.Close()

	// Print the response
	respBody, _ := io.ReadAll(resp.Body)
	fmt.Printf("HTTP/1.1 Response: %s\n", string(respBody))

	return nil
}

func main() {
	filepath := "test_file.bin"
	url := "http://localhost:8080/upload"

	err := uploadFileHTTP1(filepath, url)
	if err != nil {
		fmt.Printf("HTTP/1.1 Error: %v\n", err)
	}
}
