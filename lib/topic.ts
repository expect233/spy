import { Topic, Language } from '../types/game';

// AI 題目產生器介面
export interface ITopicProvider {
  generate(lang: Language): Promise<Topic>;
}

// 內建題庫 - 50+ 組相近詞
const BUILTIN_TOPICS: Topic[] = [
  { civilian: '蘋果', undercover: '梨子' },
  { civilian: '火車', undercover: '地鐵' },
  { civilian: '咖啡', undercover: '奶茶' },
  { civilian: '貓咪', undercover: '狗狗' },
  { civilian: '電影', undercover: '電視劇' },
  { civilian: '手機', undercover: '平板' },
  { civilian: '汽車', undercover: '機車' },
  { civilian: '麵包', undercover: '蛋糕' },
  { civilian: '游泳', undercover: '潛水' },
  { civilian: '醫生', undercover: '護士' },
  { civilian: '老師', undercover: '教授' },
  { civilian: '學生', undercover: '研究生' },
  { civilian: '書本', undercover: '雜誌' },
  { civilian: '音樂', undercover: '歌曲' },
  { civilian: '畫畫', undercover: '素描' },
  { civilian: '跑步', undercover: '慢跑' },
  { civilian: '籃球', undercover: '排球' },
  { civilian: '足球', undercover: '橄欖球' },
  { civilian: '冰淇淋', undercover: '雪糕' },
  { civilian: '巧克力', undercover: '糖果' },
  { civilian: '牛奶', undercover: '豆漿' },
  { civilian: '米飯', undercover: '麵條' },
  { civilian: '雞肉', undercover: '豬肉' },
  { civilian: '魚', undercover: '蝦' },
  { civilian: '蔬菜', undercover: '水果' },
  { civilian: '紅色', undercover: '粉色' },
  { civilian: '藍色', undercover: '綠色' },
  { civilian: '黑色', undercover: '灰色' },
  { civilian: '白色', undercover: '米色' },
  { civilian: '大象', undercover: '河馬' },
  { civilian: '獅子', undercover: '老虎' },
  { civilian: '鳥', undercover: '雞' },
  { civilian: '花', undercover: '草' },
  { civilian: '樹', undercover: '竹子' },
  { civilian: '山', undercover: '丘陵' },
  { civilian: '海', undercover: '湖' },
  { civilian: '河', undercover: '溪' },
  { civilian: '太陽', undercover: '月亮' },
  { civilian: '星星', undercover: '行星' },
  { civilian: '雲', undercover: '霧' },
  { civilian: '雨', undercover: '雪' },
  { civilian: '風', undercover: '颱風' },
  { civilian: '春天', undercover: '夏天' },
  { civilian: '秋天', undercover: '冬天' },
  { civilian: '早上', undercover: '中午' },
  { civilian: '下午', undercover: '晚上' },
  { civilian: '昨天', undercover: '明天' },
  { civilian: '房子', undercover: '公寓' },
  { civilian: '學校', undercover: '大學' },
  { civilian: '醫院', undercover: '診所' },
  { civilian: '銀行', undercover: '郵局' },
  { civilian: '超市', undercover: '便利店' },
  { civilian: '餐廳', undercover: '咖啡廳' },
  { civilian: '公園', undercover: '廣場' },
  { civilian: '圖書館', undercover: '書店' },
  { civilian: '電腦', undercover: '筆電' },
  { civilian: '鍵盤', undercover: '滑鼠' },
  { civilian: '螢幕', undercover: '顯示器' },
  { civilian: '耳機', undercover: '喇叭' },
  { civilian: '相機', undercover: '攝影機' },
  { civilian: '眼鏡', undercover: '太陽眼鏡' },
  { civilian: '帽子', undercover: '頭盔' },
  { civilian: '鞋子', undercover: '拖鞋' },
  { civilian: '襪子', undercover: '絲襪' },
  { civilian: '外套', undercover: '夾克' },
  { civilian: '褲子', undercover: '短褲' },
  { civilian: '裙子', undercover: '洋裝' }
];

// 英文題庫
const EN_TOPICS: Topic[] = [
  { civilian: 'apple', undercover: 'orange' },
  { civilian: 'cat', undercover: 'dog' },
  { civilian: 'coffee', undercover: 'tea' },
  { civilian: 'movie', undercover: 'TV show' },
  { civilian: 'spring', undercover: 'summer' },
  { civilian: 'doctor', undercover: 'nurse' },
  { civilian: 'airplane', undercover: 'train' },
  { civilian: 'book', undercover: 'magazine' },
  { civilian: 'swimming', undercover: 'running' },
  { civilian: 'pizza', undercover: 'burger' },
  { civilian: 'phone', undercover: 'tablet' },
  { civilian: 'teacher', undercover: 'student' },
  { civilian: 'music', undercover: 'song' },
  { civilian: 'ocean', undercover: 'lake' },
  { civilian: 'breakfast', undercover: 'lunch' },
  { civilian: 'red', undercover: 'pink' },
  { civilian: 'basketball', undercover: 'football' },
  { civilian: 'ice cream', undercover: 'cake' },
  { civilian: 'glasses', undercover: 'sunglasses' },
  { civilian: 'rain', undercover: 'snow' },
  { civilian: 'pen', undercover: 'pencil' },
  { civilian: 'chair', undercover: 'sofa' },
  { civilian: 'flower', undercover: 'grass' },
  { civilian: 'moon', undercover: 'sun' },
  { civilian: 'winter', undercover: 'autumn' },
  { civilian: 'milk', undercover: 'juice' },
  { civilian: 'computer', undercover: 'laptop' },
  { civilian: 'bus', undercover: 'taxi' },
  { civilian: 'bread', undercover: 'toast' },
  { civilian: 'shoes', undercover: 'slippers' },
];

// 敏感詞過濾列表
const SENSITIVE_WORDS = [
  '政治', '宗教', '種族', '性別', '暴力', '色情', '毒品', '賭博',
  'politics', 'religion', 'race', 'violence', 'sex', 'drug', 'gambling'
];

// OpenAI 題目產生器
class OpenAITopicProvider implements ITopicProvider {
  private apiKey: string;
  private usedTopics: Set<string> = new Set();

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generate(lang: Language = 'zh-TW'): Promise<Topic> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: this.createSystemPrompt(lang),
            },
            {
              role: 'user',
              content: this.createUserPrompt(lang),
            }
          ],
          max_tokens: 100,
          temperature: 0.8,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API 錯誤: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('OpenAI 回應格式錯誤');
      }

      // 解析 JSON 回應
      const parsed = this.parseResponse(content);

      // 檢查是否重複
      const topicKey = `${parsed.civilian}-${parsed.undercover}`;
      if (this.usedTopics.has(topicKey)) {
        // 如果重複，遞迴重新產生
        return this.generate(lang);
      }

      // 基礎審查
      if (this.containsSensitiveWords(parsed)) {
        // 如果包含敏感詞，遞迴重新產生
        return this.generate(lang);
      }

      this.usedTopics.add(topicKey);
      return {
        civilian: parsed.civilian,
        undercover: parsed.undercover,
        blank: '', // 白板沒有詞語
      };

    } catch (error) {
      console.error('OpenAI 題目產生失敗:', error);
      // 如果 AI 產生失敗，回退到內建題庫
      return this.getRandomBuiltinTopic();
    }
  }

  private createSystemPrompt(lang: Language): string {
    if (lang === 'en') {
      return `You are a topic generator for the Undercover game. Generate a pair of similar but different words for civilians and undercover players.

Requirements:
1. Words should be related but distinguishable
2. Use English
3. Avoid sensitive topics (politics, religion, race, etc.)
4. Keep words simple and clear
5. Response format must be JSON: {"civilian": "word1", "undercover": "word2"}

Examples:
{"civilian": "apple", "undercover": "orange"}
{"civilian": "train", "undercover": "subway"}`;
    }

    return `你是一個「誰是臥底」遊戲的題目產生器。請產生一組相近但不同的詞語，用於平民和臥底。

要求：
1. 兩個詞要有相似性，但又有明顯區別
2. 使用繁體中文
3. 避免敏感話題（政治、宗教、種族等）
4. 詞語要簡潔明瞭
5. 回應格式必須是 JSON: {"civilian": "詞語1", "undercover": "詞語2"}

範例：
{"civilian": "蘋果", "undercover": "梨子"}
{"civilian": "火車", "undercover": "地鐵"}`;
  }

  private createUserPrompt(lang: Language): string {
    return lang === 'en'
      ? 'Please generate a new pair of topic words'
      : '請產生一組新的題目詞語';
  }

  private parseResponse(content: string): { civilian: string; undercover: string } {
    try {
      // 嘗試提取 JSON
      const jsonMatch = content.match(/\{[^}]+\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      if (!parsed.civilian || !parsed.undercover) {
        throw new Error('Invalid JSON structure');
      }

      return {
        civilian: parsed.civilian,
        undercover: parsed.undercover,
      };
    } catch (error) {
      console.error('Failed to parse OpenAI response:', error);
      throw error;
    }
  }

  private containsSensitiveWords(topic: { civilian: string; undercover: string }): boolean {
    const text = `${topic.civilian} ${topic.undercover}`.toLowerCase();
    return SENSITIVE_WORDS.some(word => text.includes(word.toLowerCase()));
  }

  private getRandomBuiltinTopic(): Topic {
    const randomIndex = Math.floor(Math.random() * BUILTIN_TOPICS.length);
    const topic = BUILTIN_TOPICS[randomIndex];
    return {
      civilian: topic.civilian,
      undercover: topic.undercover,
      blank: '',
    };
  }
}

// 內建題庫產生器
class BuiltinTopicProvider implements ITopicProvider {
  private usedIndices: Record<Language, Set<number>> = {
    'zh-TW': new Set(),
    'en': new Set(),
  };

  async generate(lang: Language = 'zh-TW'): Promise<Topic> {
    const topics = this.getTopicsForLanguage(lang);
    const usedSet = this.usedIndices[lang];

    // 如果所有題目都用過了，重置
    if (usedSet.size >= topics.length) {
      usedSet.clear();
    }

    let randomIndex: number;
    do {
      randomIndex = Math.floor(Math.random() * topics.length);
    } while (usedSet.has(randomIndex));

    usedSet.add(randomIndex);
    const topic = topics[randomIndex];

    return {
      civilian: topic.civilian,
      undercover: topic.undercover,
      blank: '', // 白板沒有詞語
    };
  }

  private getTopicsForLanguage(lang: Language) {
    if (lang === 'en') {
      return EN_TOPICS;
    }
    return BUILTIN_TOPICS;
  }
}

// 工廠函式：根據環境變數決定使用哪個產生器
export function createTopicProvider(): ITopicProvider {
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (openaiApiKey) {
    console.log('使用 OpenAI 題目產生器');
    return new OpenAITopicProvider(openaiApiKey);
  } else {
    console.log('使用內建題庫');
    return new BuiltinTopicProvider();
  }
}

/**
 * 內容過濾器
 */
export class ContentFilter {
  private static inappropriateWords = [
    // 中文不當詞彙
    '死', '殺', '血', '暴力', '色情', '毒品', '賭博', '政治', '宗教',
    // 英文不當詞彙
    'kill', 'death', 'blood', 'violence', 'sex', 'drug', 'gambling', 'politics', 'religion',
  ];

  static isAppropriate(text: string): boolean {
    const lowerText = text.toLowerCase();
    return !this.inappropriateWords.some(word =>
      lowerText.includes(word.toLowerCase())
    );
  }

  static filterTopic(topic: Topic): Topic | null {
    if (!this.isAppropriate(topic.civilian) || !this.isAppropriate(topic.undercover)) {
      return null;
    }
    return topic;
  }
}

/**
 * 獲取過濾後的題目
 */
export async function getFilteredTopic(lang: Language = 'zh-TW'): Promise<Topic> {
  const provider = createTopicProvider();
  let attempts = 0;
  const maxAttempts = 5;

  while (attempts < maxAttempts) {
    try {
      const topic = await provider.generate(lang);
      const filteredTopic = ContentFilter.filterTopic(topic);

      if (filteredTopic) {
        return filteredTopic;
      }

      attempts++;
    } catch (error) {
      console.error(`Topic generation attempt ${attempts + 1} failed:`, error);
      attempts++;
    }
  }

  // 如果所有嘗試都失敗，回退到安全的預設題目
  return {
    civilian: lang === 'en' ? 'apple' : '蘋果',
    undercover: lang === 'en' ? 'orange' : '橘子',
    blank: '',
  };
}

// 預設匯出
export const topicProvider = createTopicProvider();
