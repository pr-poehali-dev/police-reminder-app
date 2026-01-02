import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';

const API_URL = 'https://functions.poehali.dev/ae53e1c2-96ac-4a9e-924e-9692a718ddf1';

interface Article {
  id: number;
  title: string;
  content: string;
  category: string;
  tags: string[];
}

const categories = [
  { id: 'all', name: 'Все', icon: 'Grid3x3' },
  { id: 'administrative', name: 'Административная практика', icon: 'Scale' },
  { id: 'rights', name: 'Права', icon: 'ShieldCheck' },
  { id: 'laws', name: 'Законы', icon: 'BookOpen' },
  { id: 'documents', name: 'Документы', icon: 'FileText' }
];

export default function Index() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [bookmarks, setBookmarks] = useState<Set<number>>(new Set());
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      setArticles(data);
    } catch (error) {
      console.error('Failed to load articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleBookmark = (id: number) => {
    const newBookmarks = new Set(bookmarks);
    if (newBookmarks.has(id)) {
      newBookmarks.delete(id);
    } else {
      newBookmarks.add(id);
    }
    setBookmarks(newBookmarks);
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = activeCategory === 'all' || article.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const bookmarkedArticles = articles.filter(article => bookmarks.has(article.id));

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon name="Shield" size={32} className="text-primary-foreground" />
              <h1 className="text-2xl font-bold">Памятка полицейского</h1>
            </div>
            <Button 
              variant="secondary" 
              size="icon"
              onClick={() => navigate('/admin')}
              title="Админ-панель"
            >
              <Icon name="Settings" size={20} />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-6 relative">
          <Icon name="Search" size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Поиск по статьям, законам, документам..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>

        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="content" className="flex items-center gap-2">
              <Icon name="BookOpen" size={18} />
              Материалы
            </TabsTrigger>
            <TabsTrigger value="bookmarks" className="flex items-center gap-2">
              <Icon name="Bookmark" size={18} />
              Закладки ({bookmarks.size})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all ${
                    activeCategory === cat.id
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-card hover:bg-muted'
                  }`}
                >
                  <Icon name={cat.icon} size={24} />
                  <span className="text-xs text-center font-medium">{cat.name}</span>
                </button>
              ))}
            </div>

            {loading ? (
              <div className="text-center py-12">
                <Icon name="Loader2" size={48} className="animate-spin mx-auto text-muted-foreground" />
              </div>
            ) : filteredArticles.length === 0 ? (
              <Card className="p-8 text-center">
                <Icon name="SearchX" size={48} className="mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Ничего не найдено</p>
              </Card>
            ) : (
              <Accordion type="single" collapsible className="space-y-3">
                {filteredArticles.map(article => (
                  <AccordionItem key={article.id} value={article.id} className="border rounded-lg overflow-hidden bg-card">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                      <div className="flex items-start justify-between w-full pr-2">
                        <div className="flex-1 text-left">
                          <h3 className="font-semibold text-base mb-1">{article.title}</h3>
                          <div className="flex flex-wrap gap-1">
                            {article.tags.map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleBookmark(article.id);
                          }}
                          className="ml-2"
                        >
                          <Icon
                            name="Bookmark"
                            size={20}
                            className={bookmarks.has(article.id) ? 'fill-primary text-primary' : 'text-muted-foreground'}
                          />
                        </button>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 pt-2">
                      <p className="text-sm text-muted-foreground leading-relaxed">{article.content}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </TabsContent>

          <TabsContent value="bookmarks" className="space-y-3">
            {bookmarkedArticles.length === 0 ? (
              <Card className="p-8 text-center">
                <Icon name="BookmarkX" size={48} className="mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-2">Нет сохранённых материалов</p>
                <p className="text-sm text-muted-foreground">Добавьте закладки для быстрого доступа</p>
              </Card>
            ) : (
              <Accordion type="single" collapsible className="space-y-3">
                {bookmarkedArticles.map(article => (
                  <AccordionItem key={article.id} value={article.id} className="border rounded-lg overflow-hidden bg-card">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                      <div className="flex items-start justify-between w-full pr-2">
                        <div className="flex-1 text-left">
                          <h3 className="font-semibold text-base mb-1">{article.title}</h3>
                          <div className="flex flex-wrap gap-1">
                            {article.tags.map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleBookmark(article.id);
                          }}
                          className="ml-2"
                        >
                          <Icon
                            name="Bookmark"
                            size={20}
                            className="fill-primary text-primary"
                          />
                        </button>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 pt-2">
                      <p className="text-sm text-muted-foreground leading-relaxed">{article.content}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <div className="h-4" />
    </div>
  );
}