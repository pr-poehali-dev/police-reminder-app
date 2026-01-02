import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';

interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
}

const mockData: Article[] = [
  {
    id: '1',
    title: 'Статья 20.1 КоАП РФ',
    content: 'Мелкое хулиганство — нарушение общественного порядка, выражающее явное неуважение к обществу...',
    category: 'administrative',
    tags: ['хулиганство', 'порядок']
  },
  {
    id: '2',
    title: 'Право на задержание',
    content: 'Полицейский имеет право задержать лицо при наличии достаточных оснований...',
    category: 'rights',
    tags: ['задержание', 'полномочия']
  },
  {
    id: '3',
    title: 'Статья 228 УК РФ',
    content: 'Незаконные приобретение, хранение, перевозка, изготовление, переработка наркотических средств...',
    category: 'laws',
    tags: ['наркотики', 'уголовное']
  },
  {
    id: '4',
    title: 'Протокол об административном правонарушении',
    content: 'Форма протокола, требования к оформлению и обязательные реквизиты...',
    category: 'documents',
    tags: ['протокол', 'оформление']
  },
  {
    id: '5',
    title: 'Статья 12.8 КоАП РФ',
    content: 'Управление транспортным средством водителем, находящимся в состоянии опьянения...',
    category: 'administrative',
    tags: ['опьянение', 'транспорт']
  },
  {
    id: '6',
    title: 'Применение физической силы',
    content: 'Полицейский имеет право применять физическую силу в случаях...',
    category: 'rights',
    tags: ['применение силы', 'полномочия']
  },
  {
    id: '7',
    title: 'Статья 158 УК РФ',
    content: 'Кража — тайное хищение чужого имущества...',
    category: 'laws',
    tags: ['кража', 'хищение']
  },
  {
    id: '8',
    title: 'Постановление по делу об административном правонарушении',
    content: 'Форма и содержание постановления при вынесении решения...',
    category: 'documents',
    tags: ['постановление', 'решение']
  }
];

const categories = [
  { id: 'all', name: 'Все', icon: 'Grid3x3' },
  { id: 'administrative', name: 'Административная практика', icon: 'Scale' },
  { id: 'rights', name: 'Права', icon: 'ShieldCheck' },
  { id: 'laws', name: 'Законы', icon: 'BookOpen' },
  { id: 'documents', name: 'Документы', icon: 'FileText' }
];

export default function Index() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());

  const toggleBookmark = (id: string) => {
    const newBookmarks = new Set(bookmarks);
    if (newBookmarks.has(id)) {
      newBookmarks.delete(id);
    } else {
      newBookmarks.add(id);
    }
    setBookmarks(newBookmarks);
  };

  const filteredArticles = mockData.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = activeCategory === 'all' || article.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const bookmarkedArticles = mockData.filter(article => bookmarks.has(article.id));

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Icon name="Shield" size={32} className="text-primary-foreground" />
            <h1 className="text-2xl font-bold">Памятка полицейского</h1>
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

            {filteredArticles.length === 0 ? (
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
