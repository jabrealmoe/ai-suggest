import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdminPage from './AdminPage';
import { invoke } from '@forge/bridge';

// Mock ThreeDonutChart because it uses Canvas/WebGL which jsdom doesn't support well
vi.mock('./ThreeDonutChart', () => ({
  default: () => <div data-testid="mock-donut-chart">Donut Chart</div>
}));

// Mock ParticleSwarm because it might use canvas or animation 
vi.mock('./ParticleSwarm', () => ({
    default: () => <div data-testid="mock-particle-swarm">Particle Swarm</div>
}));

describe('AdminPage Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default mocks
        invoke.mockResolvedValue({}); 
    });

    it('renders the loading state initially', () => {
        // Delay the resolution of invoke to check loading state
        invoke.mockImplementation(() => new Promise(() => {}));
        render(<AdminPage />);
        expect(screen.getByText(/Loading settings.../i)).toBeInTheDocument();
    });

    it('renders configuration inputs after loading', async () => {
        const mockConfig = {
            minScore: 85,
            modelName: 'Test GPT',
            n8nUrl: 'https://test.n8n.com',
            temperature: 0.8
        };
        invoke.mockResolvedValueOnce(mockConfig); // getAppConfig
        invoke.mockResolvedValueOnce({}); // getLlmUsageStats (empty)

        render(<AdminPage />);

        await waitFor(() => {
            expect(screen.queryByText(/Loading settings/i)).not.toBeInTheDocument();
        });

        // Check Header
        expect(screen.getByText(/Dr. Jira Admin/i)).toBeInTheDocument();

        // Check Inputs
        expect(screen.getByDisplayValue('85')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Test GPT')).toBeInTheDocument();
        expect(screen.getByDisplayValue('https://test.n8n.com')).toBeInTheDocument();
        expect(screen.getByDisplayValue('0.8')).toBeInTheDocument();
    });

    it('handles n8n connection testing', async () => {
        const mockConfig = { n8nUrl: 'https://test.n8n.com' };
        invoke.mockResolvedValueOnce(mockConfig);
        invoke.mockResolvedValueOnce({}); 

        render(<AdminPage />);
        await waitFor(() => screen.getByText(/Dr. Jira Admin/i));

        const testButton = screen.getByText('Test');
        expect(testButton).toBeInTheDocument();
    });
});
