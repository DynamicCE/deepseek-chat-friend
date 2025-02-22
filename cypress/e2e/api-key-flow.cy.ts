describe('API Key Management Flow', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173');
  });

  it('should complete full API key management flow', () => {
    // API key formunun görüntülenmesi
    cy.findByPlaceholderText(/OPENAI API Anahtarını Girin/i).should('exist');
    cy.findByText(/API Anahtarını Kaydet/i).should('exist').and('be.disabled');

    // Geçerli API key girişi
    cy.findByPlaceholderText(/OPENAI API Anahtarını Girin/i)
      .type('sk-test-valid-key');

    // API key'in kaydedilmesi
    cy.findByText(/API Anahtarını Kaydet/i)
      .should('be.enabled')
      .click();

    // Başarılı kayıt mesajının görüntülenmesi
    cy.findByText(/API anahtarı güvenli bir şekilde kaydedildi/i)
      .should('exist');

    // Chat arayüzünün görüntülenmesi
    cy.findByPlaceholderText(/Mesajınızı yazın/i)
      .should('exist');

    // Test mesajı gönderme
    cy.findByPlaceholderText(/Mesajınızı yazın/i)
      .type('Merhaba!');

    cy.findByRole('button', { name: /gönder/i })
      .click();

    // AI yanıtının beklenmesi
    cy.findByText(/AI yanıtı bekleniyor/i)
      .should('exist');

    // Yanıtın görüntülenmesi (mock response)
    cy.findByText(/Test yanıtı/i)
      .should('exist');
  });

  it('should handle invalid API key submission', () => {
    cy.findByPlaceholderText(/OPENAI API Anahtarını Girin/i)
      .type('invalid-key');

    cy.findByText(/API Anahtarını Kaydet/i)
      .click();

    cy.findByText(/Geçersiz API anahtarı/i)
      .should('exist');
  });

  it('should handle rate limit exceeded', () => {
    // Rate limit aşımı senaryosu
    for (let i = 0; i < 61; i++) {
      cy.findByPlaceholderText(/OPENAI API Anahtarını Girin/i)
        .clear()
        .type(`sk-test-key-${i}`);

      cy.findByText(/API Anahtarını Kaydet/i)
        .click();
    }

    cy.findByText(/Çok fazla istek gönderildi/i)
      .should('exist');
  });
}); 