package email

import (
	"fmt"
	"log"
	"net/smtp"
)

type Mailer interface {
	Send(to, subject, body string) error
}

type SMTPMailer struct {
	Host string
	Port string
	User string
	Pass string
	From string
}

func (m *SMTPMailer) Send(to, subject, body string) error {
	auth := smtp.PlainAuth("", m.User, m.Pass, m.Host)

	msg := fmt.Sprintf("To: %s\r\nFrom: %s\r\nSubject: %s\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=\"UTF-8\"\r\n\r\n%s",
		to, m.From, subject, body)

	addr := m.Host + ":" + m.Port
	return smtp.SendMail(addr, auth, m.From, []string{to}, []byte(msg))
}

type ConsoleMailer struct{}

func (m *ConsoleMailer) Send(to, subject, body string) error {
	log.Printf("[EMAIL] To: %s | Subject: %s\n%s", to, subject, body)
	return nil
}
