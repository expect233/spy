import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTopicProvider } from '@/lib/topic';

// Mock fetch for OpenAI API tests
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Topic Provider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear environment variables
    delete process.env.OPENAI_API_KEY;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('BuiltinTopicProvider', () => {
    it('應該在沒有 OpenAI API Key 時使用內建題庫', async () => {
      const provider = createTopicProvider();
      const topic = await provider.generate('zh-TW');
      
      expect(topic).toHaveProperty('civilian');
      expect(topic).toHaveProperty('undercover');
      expect(typeof topic.civilian).toBe('string');
      expect(typeof topic.undercover).toBe('string');
      expect(topic.civilian.length).toBeGreaterThan(0);
      expect(topic.undercover.length).toBeGreaterThan(0);
      expect(topic.civilian).not.toBe(topic.undercover);
    });

    it('應該產生不重複的題目', async () => {
      const provider = createTopicProvider();
      const topics = new Set();
      
      // 產生多個題目
      for (let i = 0; i < 10; i++) {
        const topic = await provider.generate('zh-TW');
        const topicKey = `${topic.civilian}-${topic.undercover}`;
        topics.add(topicKey);
      }
      
      // 應該有多個不同的題目（雖然可能會重複，但機率很低）
      expect(topics.size).toBeGreaterThan(1);
    });

    it('應該從預定義的題庫中選擇', async () => {
      const provider = createTopicProvider();
      const topic = await provider.generate('zh-TW');
      
      // 檢查是否為中文詞語
      const chineseRegex = /[\u4e00-\u9fff]/;
      expect(chineseRegex.test(topic.civilian)).toBe(true);
      expect(chineseRegex.test(topic.undercover)).toBe(true);
    });
  });

  describe('OpenAITopicProvider', () => {
    beforeEach(() => {
      process.env.OPENAI_API_KEY = 'test-api-key';
    });

    it('應該在有 API Key 時使用 OpenAI', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: '{"civilian": "測試詞1", "undercover": "測試詞2"}'
            }
          }]
        })
      };
      
      mockFetch.mockResolvedValueOnce(mockResponse);
      
      const provider = createTopicProvider();
      const topic = await provider.generate('zh-TW');
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json'
          })
        })
      );
      
      expect(topic.civilian).toBe('測試詞1');
      expect(topic.undercover).toBe('測試詞2');
    });

    it('應該在 OpenAI API 失敗時回退到內建題庫', async () => {
      const mockResponse = {
        ok: false,
        status: 500
      };
      
      mockFetch.mockResolvedValueOnce(mockResponse);
      
      const provider = createTopicProvider();
      const topic = await provider.generate('zh-TW');
      
      // 應該仍然返回有效的題目（來自內建題庫）
      expect(topic).toHaveProperty('civilian');
      expect(topic).toHaveProperty('undercover');
      expect(typeof topic.civilian).toBe('string');
      expect(typeof topic.undercover).toBe('string');
    });

    it('應該在 JSON 解析失敗時回退到內建題庫', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: 'invalid json'
            }
          }]
        })
      };
      
      mockFetch.mockResolvedValueOnce(mockResponse);
      
      const provider = createTopicProvider();
      const topic = await provider.generate('zh-TW');
      
      // 應該仍然返回有效的題目（來自內建題庫）
      expect(topic).toHaveProperty('civilian');
      expect(topic).toHaveProperty('undercover');
    });

    it('應該在網路錯誤時回退到內建題庫', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      
      const provider = createTopicProvider();
      const topic = await provider.generate('zh-TW');
      
      // 應該仍然返回有效的題目（來自內建題庫）
      expect(topic).toHaveProperty('civilian');
      expect(topic).toHaveProperty('undercover');
    });

    it('應該發送正確的請求格式到 OpenAI', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: '{"civilian": "測試詞1", "undercover": "測試詞2"}'
            }
          }]
        })
      };
      
      mockFetch.mockResolvedValueOnce(mockResponse);
      
      const provider = createTopicProvider();
      await provider.generate('zh-TW');
      
      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);
      
      expect(requestBody).toMatchObject({
        model: 'gpt-3.5-turbo',
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'system',
            content: expect.stringContaining('誰是臥底')
          }),
          expect.objectContaining({
            role: 'user',
            content: expect.stringContaining('請產生一組新的題目詞語')
          })
        ]),
        max_tokens: 100,
        temperature: 0.8
      });
    });

    it('應該處理缺少 content 的回應', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          choices: [{}]
        })
      };
      
      mockFetch.mockResolvedValueOnce(mockResponse);
      
      const provider = createTopicProvider();
      const topic = await provider.generate('zh-TW');
      
      // 應該回退到內建題庫
      expect(topic).toHaveProperty('civilian');
      expect(topic).toHaveProperty('undercover');
    });

    it('應該處理格式不正確的 JSON 回應', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: '{"civilian": "測試詞1"}' // 缺少 undercover
            }
          }]
        })
      };
      
      mockFetch.mockResolvedValueOnce(mockResponse);
      
      const provider = createTopicProvider();
      const topic = await provider.generate('zh-TW');
      
      // 應該回退到內建題庫
      expect(topic).toHaveProperty('civilian');
      expect(topic).toHaveProperty('undercover');
    });
  });

  describe('Topic Quality', () => {
    it('產生的題目應該是有意義的中文詞語', async () => {
      const provider = createTopicProvider();
      const topic = await provider.generate('zh-TW');
      
      // 檢查長度合理
      expect(topic.civilian.length).toBeGreaterThan(0);
      expect(topic.civilian.length).toBeLessThanOrEqual(10);
      expect(topic.undercover.length).toBeGreaterThan(0);
      expect(topic.undercover.length).toBeLessThanOrEqual(10);
      
      // 檢查不包含特殊字符
      expect(topic.civilian).toMatch(/^[\u4e00-\u9fff\w]+$/);
      expect(topic.undercover).toMatch(/^[\u4e00-\u9fff\w]+$/);
    });

    it('平民詞和臥底詞應該不同', async () => {
      const provider = createTopicProvider();
      
      for (let i = 0; i < 5; i++) {
        const topic = await provider.generate('zh-TW');
        expect(topic.civilian).not.toBe(topic.undercover);
      }
    });
  });
});
