/** @jest-environment jsdom */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiKeyForm } from '../components/ApiKeyForm';
import { ApiKeyProvider } from '../contexts/ApiKeyContext';
import { validateApiKey } from '../utils/openai';
import { checkRateLimit, setSecureApiKey } from '../utils/security';
import { Toaster } from '@/components/ui/toaster';

// Mock modules
jest.mock('../utils/openai', () => ({
  validateApiKey: jest.fn()
}));

jest.mock('../utils/security', () => {
  const originalModule = jest.requireActual('../utils/security');
  return {
    ...originalModule,
    checkRateLimit: jest.fn(),
    setSecureApiKey: jest.fn(),
  };
});

const mockValidateApiKey = validateApiKey as jest.MockedFunction<typeof validateApiKey>;
const mockCheckRateLimit = checkRateLimit as jest.MockedFunction<typeof checkRateLimit>;
const mockSetSecureApiKey = setSecureApiKey as jest.MockedFunction<typeof setSecureApiKey>;

describe('ApiKeyForm Integration Tests', () => {
  const renderComponent = () => {
    return render(
      <>
        <ApiKeyProvider>
          <ApiKeyForm provider="openai" />
        </ApiKeyProvider>
        <Toaster />
      </>
    );
  };

  beforeEach(() => {
    mockValidateApiKey.mockResolvedValue(true);
    mockCheckRateLimit.mockReturnValue(true);
    mockSetSecureApiKey.mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render API key input form', () => {
    renderComponent();
    expect(screen.getByPlaceholderText(/OPENAI API Anahtarını Girin/i)).toBeInTheDocument();
    expect(screen.getByText(/API Anahtarını Kaydet/i)).toBeInTheDocument();
  });

  it('should handle successful API key submission', async () => {
    renderComponent();
    const input = screen.getByPlaceholderText(/OPENAI API Anahtarını Girin/i);
    const submitButton = screen.getByText(/API Anahtarını Kaydet/i);

    await userEvent.type(input, 'sk-test-valid-key');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSetSecureApiKey).toHaveBeenCalledWith('openai', 'sk-test-valid-key');
      expect(screen.getByText(/API anahtarı güvenli bir şekilde kaydedildi/i)).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('should handle invalid API key submission', async () => {
    mockValidateApiKey.mockResolvedValue(false);
    renderComponent();
    
    const input = screen.getByPlaceholderText(/OPENAI API Anahtarını Girin/i);
    const submitButton = screen.getByText(/API Anahtarını Kaydet/i);

    await userEvent.type(input, 'invalid-key');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSetSecureApiKey).not.toHaveBeenCalled();
      expect(screen.getByText(/Geçersiz API anahtarı/i)).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('should handle rate limit exceeded', async () => {
    mockCheckRateLimit.mockReturnValue(false);
    renderComponent();
    
    const input = screen.getByPlaceholderText(/OPENAI API Anahtarını Girin/i);
    const submitButton = screen.getByText(/API Anahtarını Kaydet/i);

    await userEvent.type(input, 'sk-test-key');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockValidateApiKey).not.toHaveBeenCalled();
      expect(mockSetSecureApiKey).not.toHaveBeenCalled();
      expect(screen.getByText(/Çok fazla istek gönderildi/i)).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('should handle API validation error', async () => {
    mockValidateApiKey.mockRejectedValue(new Error('API Error'));
    renderComponent();
    
    const input = screen.getByPlaceholderText(/OPENAI API Anahtarını Girin/i);
    const submitButton = screen.getByText(/API Anahtarını Kaydet/i);

    await userEvent.type(input, 'sk-test-key');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSetSecureApiKey).not.toHaveBeenCalled();
      expect(screen.getByText(/API anahtarı doğrulanırken bir hata oluştu/i)).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('should disable submit button when input is empty', () => {
    renderComponent();
    const submitButton = screen.getByText(/API Anahtarını Kaydet/i);
    expect(submitButton).toBeDisabled();
  });

  it('should show loading state during API key validation', async () => {
    mockValidateApiKey.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(true), 100)));
    renderComponent();
    
    const input = screen.getByPlaceholderText(/OPENAI API Anahtarını Girin/i);
    const submitButton = screen.getByText(/API Anahtarını Kaydet/i);

    await userEvent.type(input, 'sk-test-key');
    fireEvent.click(submitButton);

    expect(screen.getByText(/Doğrulanıyor/i)).toBeInTheDocument();
  });
}); 