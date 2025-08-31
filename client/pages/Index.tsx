import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Bar, BarChart, PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { CheckCircle2, Hash, Image as ImageIcon, Link as LinkIcon, Loader2, MessageCircle, Rocket, SmilePlus, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { extractTextFromFile } from "@/lib/extractors";
import { useToast } from "@/hooks/use-toast";

const samples = [
  {
    label: "Launch tease",
    text:
      "We just dropped something big 🚀 Can you guess what's coming? Early birds get access first — comment 'ready' to join the waitlist! #startup #productlaunch",
  },
  {
    label: "Value post",
    text:
      "5 hooks that boosted our engagement by 3x:\n1) 'You won't believe…'\n2) 'We made a mistake…'\n3) 'This saved us $10k'\n4) 'Stop doing this'\n5) 'We tested everything' #marketing #growth",
  },
  {
    label: "Short quote",
    text: "Consistency beats intensity. Show up, even when it's not perfect. ✨",
  },
];

type Platform = "twitter" | "instagram" | "tiktok" | "youtube" | "linkedin";

function tokenize(text: string) {
  return text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^a-z0-9#@\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

const stopwords = new Set([
  "the","a","an","and","or","but","if","in","on","for","with","to","of","at","by","from","as","is","it","this","that","we","you","our","your","be","are","was","were","us"
]);

function estimateSyllables(word: string) {
  const w = word.toLowerCase().replace(/e$/," ");
  const m = w.match(/[aeiouy]+/g);
  return Math.max(1, m ? m.length : 1);
}

function toHashtag(s: string) {
  const cleaned = s.replace(/[^a-z0-9]+/gi, "").toLowerCase();
  return cleaned ? `#${cleaned}` : "";
}

function buildHashtags(tokens: string[], words: string[], platform: Platform, existing: Set<string>, exclude: Set<string>, nonce = 0) {
  const noise = new Set([
    "http","https","www","com","views","likes","subscribers","subscribe","channel","video","click","here","watch","today","live","breaking","news","2024","2025","official","new","latest","link","bio","follow","pls","please"
  ]);

  const validWord = (w: string) => w.length >= 3 && !noise.has(w) && !stopwords.has(w) && !/^\d+$/.test(w);

  // unigrams
  const uni = new Map<string, number>();
  for (const w of words) if (validWord(w)) uni.set(w, (uni.get(w) ?? 0) + 1);

  // bigrams
  const bi = new Map<string, number>();
  for (let i = 0; i < words.length - 1; i++) {
    const a = words[i], b = words[i + 1];
    if (validWord(a) && validWord(b)) {
      const key = `${a} ${b}`;
      bi.set(key, (bi.get(key) ?? 0) + 1);
    }
  }

  // score candidates (favor bigrams)
  const candidates: Array<{ term: string; score: number }> = [];
  for (const [k, v] of uni) candidates.push({ term: k, score: v });
  for (const [k, v] of bi) candidates.push({ term: k, score: v * 2 });
  // small jitter so Regenerate can reshuffle ties
  candidates.forEach((c, i) => (c.score += (Math.random() - 0.5) * 0.1));

  // emoji cues
  const emojiMap: Record<string, string> = { "🚀": "launch", "🔥": "trending", "✨": "tips", "🎯": "goals", "📈": "growth" };
  for (const t of tokens) for (const [e, w] of Object.entries(emojiMap)) if (t.includes(e)) candidates.push({ term: w, score: 1.2 });

  candidates.sort((a, b) => b.score - a.score);

  // platform caps
  const cap: Record<Platform, number> = { twitter: 3, instagram: 7, tiktok: 5, youtube: 5, linkedin: 5 };
  const out: string[] = [];
  for (const { term } of candidates) {
    const tag = toHashtag(term);
    if (!tag) continue;
    if (existing.has(tag)) continue;
    if (exclude.has(tag)) continue;
    if (out.includes(tag)) continue;
    out.push(tag);
    if (out.length >= cap[platform]) break;
  }

  // ensure at least 2 general but relevant fallbacks
  const general = ["#growth", "#marketing", "#strategy", "#content"];
  for (const g of general) {
    if (out.length >= Math.max(3, cap[platform])) break;
    if (!existing.has(g) && !out.includes(g)) out.push(g);
  }

  return out;
}

function analyze(text: string, platform: Platform, nonce = 0, exclude?: Set<string>) {
  const tokens = tokenize(text);
  const words = tokens.filter((t) => !t.startsWith("#") && !t.startsWith("@"));
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);

  const positive = ["great","amazing","love","win","wow","good","awesome","best","excited","happy","success","ready","incredible"];
  const negative = ["bad","hate","problem","fail","sad","angry","worst","bug","issue","late","slow"];

  let sentimentScore = 0;
  for (const w of words) {
    if (positive.includes(w)) sentimentScore += 1;
    if (negative.includes(w)) sentimentScore -= 1;
  }
  sentimentScore += (text.match(/[😀-🙏✨🚀🔥💥💯🥳😊😍👍👏]/gu)?.length ?? 0) * 0.5;
  sentimentScore += (text.match(/!+/g)?.length ?? 0) * 0.2;
  const sentiment = Math.max(0, Math.min(100, 50 + sentimentScore * 10));

  const wordCount = words.length;
  const charPerWord = words.reduce((a, w) => a + w.length, 0) / Math.max(1, wordCount);
  const syllables = words.reduce((a, w) => a + estimateSyllables(w), 0);
  const sentCount = Math.max(1, sentences.length);
  const readingEase = 206.835 - 1.015 * (wordCount / sentCount) - 84.6 * (syllables / Math.max(1, wordCount));
  const clarity = Math.max(0, Math.min(100, (readingEase + 10)));

  const hashtags = tokens.filter((t) => t.startsWith("#"));
  const mentions = tokens.filter((t) => t.startsWith("@"));
  const links = text.match(/https?:\/\/\S+/g) ?? [];
  const hashtagDensity = Math.min(100, (hashtags.length / Math.max(1, wordCount)) * 600);

  const cta = /(join|sign up|comment|like|share|retweet|follow|subscribe|download|try)/i.test(text);

  // Platform length heuristics
  const targetLength: Record<Platform, number> = {
    twitter: 120,
    instagram: 140,
    tiktok: 120,
    youtube: 200,
    linkedin: 180,
  };
  const lengthScore = Math.max(0, 100 - Math.abs(wordCount - targetLength[platform]) * 0.8);

  // Engagement prediction (toy model)
  const engagement = Math.round(
    0.3 * sentiment +
      0.25 * clarity +
      0.15 * (cta ? 100 : 50) +
      0.15 * Math.min(100, hashtags.length * 20) +
      0.15 * lengthScore,
  );

  const keywordMap = new Map<string, number>();
  for (const w of words) {
    if (stopwords.has(w)) continue;
    keywordMap.set(w, (keywordMap.get(w) ?? 0) + 1);
  }
  const keywords = Array.from(keywordMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([k, v]) => ({ key: k, value: v }));

  // Build hashtag suggestions using n-grams and noise filtering
  const existing = new Set(hashtags.map((h) => h.toLowerCase()));
  let suggestions = buildHashtags(tokens, words, platform, existing, exclude ?? new Set(), nonce);
  if (suggestions.length === 0) {
    suggestions = buildHashtags(tokens, words, platform, existing, new Set(), nonce);
  }

  const radar = [
    { k: "Emotion", v: Math.round(sentiment) },
    { k: "Clarity", v: Math.round(clarity) },
    { k: "Hashtags", v: Math.round(hashtagDensity) },
    { k: "CTA", v: cta ? 100 : 30 },
    { k: "Length", v: Math.round(lengthScore) },
  ];

  const bestTimes: Record<Platform, string> = {
    twitter: "Tue–Thu 9–11am",
    instagram: "Mon–Fri 11am–1pm",
    tiktok: "Tue–Thu 6–9pm",
    youtube: "Thu–Sun 12–3pm",
    linkedin: "Tue–Thu 8–10am",
  };

  return {
    wordCount,
    sentiment: Math.round(sentiment),
    clarity: Math.round(clarity),
    hashtags: hashtags.length,
    mentions: mentions.length,
    links: links.length,
    hashtagDensity: Math.round(hashtagDensity),
    cta,
    engagement,
    radar,
    keywords,
    bestTime: bestTimes[platform],
    hashtagSuggestions: suggestions.slice(0, 6),
  };
}

function optimizeContent(text: string, platform: Platform, r: ReturnType<typeof analyze>) {
  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const base = sentences.slice(0, 2).join(". ") + (sentences.length > 0 ? "." : "");
  const ctaByPlatform: Record<Platform, string> = {
    twitter: "Comment 'yes' for details",
    instagram: "Save this and share with a friend",
    tiktok: "Follow for more and drop a 'yes' if you want the link",
    youtube: "Subscribe for more and comment your thoughts",
    linkedin: "Comment 'interested' for details",
  };
  const ensureCTA = (s: string) => (/(join|sign up|comment|like|share|retweet|follow|subscribe|download|try)/i.test(s) ? s : s + " " + ctaByPlatform[platform] + ".");

  const tagsToAdd = r.hashtagSuggestions.slice(0, 3).join(" ");
  const withTags = (s: string) => (tagsToAdd ? `${s} ${tagsToAdd}` : s);

  // Variant 1: Concise punchy
  const hook = r.keywords[0]?.key ? `🚀 ${r.keywords[0].key.charAt(0).toUpperCase() + r.keywords[0].key.slice(1)} —` : "🚀";
  const concise = withTags(ensureCTA(`${hook} ${base}`.replace(/\s+/g, " ").trim()));

  // Variant 2: Benefit-driven
  const k1 = r.keywords[0]?.key ?? "results";
  const k2 = r.keywords[1]?.key ?? "growth";
  const benefit = withTags(ensureCTA(`Want better ${k1}? Here's how we approach ${k2}. ${base}`));

  // Variant 3: List-style teaser (single line with dashes)
  const list = withTags(ensureCTA(`${k1} • ${k2} • ${r.keywords[2]?.key ?? "tips"} — ${base}`));

  return { concise, benefit, list };
}

export default function Index() {
  const [platform, setPlatform] = useState<Platform>("twitter");
  const [url, setUrl] = useState("");
  const [text, setText] = useState(samples[0].text);
  const [uploading, setUploading] = useState(false);
  const [regen, setRegen] = useState(0);
  const [excludeTags, setExcludeTags] = useState<string[]>([]);
  const { toast } = useToast();
  const result = useMemo(() => (text.trim() ? analyze(text, platform, regen, new Set(excludeTags)) : null), [text, platform, regen, excludeTags]);

  // Reset exclusions whenever source content or platform changes
  // eslint-disable-next-line react-hooks/exhaustive-deps

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      const extracted = await extractTextFromFile(file);
      if (extracted) {
        setText(extracted);
        toast({ title: "Content extracted", description: `${file.name} parsed successfully.` });
      } else {
        toast({ title: "No text found", description: "We couldn't extract text. Try another file or paste the text." });
      }
    } catch (e: any) {
      toast({ title: "Extraction failed", description: e?.message || "Unsupported file or network error." });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <section className="container pt-12 md:pt-16">
        <div className="grid gap-8 md:grid-cols-2 md:gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold">
              <Rocket className="size-3.5" /> Social Media Content Analyzer
            </div>
            <h1 className="mt-4 text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.1]">
              Optimize every post with data-backed insights
            </h1>
            <p className="mt-4 text-muted-foreground text-base md:text-lg max-w-prose">
              Paste your caption, upload an image or PDF, and get instant analysis on sentiment, clarity, hashtags, and predicted engagement — tuned for each platform.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {samples.map((s) => (
                <button
                  key={s.label}
                  className={cn(
                    "text-xs md:text-sm px-3 py-1.5 rounded-full border",
                    "hover:bg-foreground/5 text-foreground/80",
                  )}
                  onClick={() => setText(s.text)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="glass rounded-xl p-4 md:p-6">
            <div className="grid gap-3">
              <label className="text-sm font-medium">Platform</label>
              <Select value={platform} onValueChange={(v) => setPlatform(v as Platform)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="twitter">X / Twitter</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                </SelectContent>
              </Select>

              <div className="mt-3 grid md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="text-sm font-medium">Upload Image or PDF</label>
                  <label className={cn("mt-1 flex items-center justify-between gap-3 border rounded-md p-3 cursor-pointer hover:bg-foreground/5", uploading && "opacity-70 cursor-wait") }>
                    <div className="flex items-center gap-2 text-sm text-foreground/80">
                      <Upload className="size-4" />
                      <span>Choose file (image/PDF)</span>
                    </div>
                    {uploading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <ImageIcon className="size-4 opacity-60" />
                    )}
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                      disabled={uploading}
                    />
                  </label>
                </div>
              </div>

              <label className="text-sm font-medium mt-3">Post URL (optional)</label>
              <Input
                placeholder="https://..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />

              <label className="text-sm font-medium mt-3">Caption / Content</label>
              <Textarea
                rows={6}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your post caption here for instant analysis"
              />

              <div className="flex items-center justify-between mt-2">
                <div className="text-xs text-muted-foreground">
                  Tip: Add a clear CTA and 2–3 relevant hashtags.
                </div>
                <Button onClick={() => { setExcludeTags([]); setRegen((r) => r + 1); setText((t) => t.trim()); }} disabled={uploading}>
                  {uploading ? <><Loader2 className="mr-2 size-4 animate-spin" /> Extracting...</> : "Analyze"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {result && (
        <section className="container py-10 md:py-14">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-base">Predicted Engagement</CardTitle>
                <CardDescription>Likelihood your audience interacts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div
                    className="size-14 rounded-full bg-primary/10 grid place-items-center"
                    aria-label={`Engagement score ${result.engagement}`}
                  >
                    <span className="text-xl font-bold text-primary">{result.engagement}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Best time: <span className="font-medium text-foreground">{result.bestTime}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-base">Quality Signals</CardTitle>
                <CardDescription>Quick health check</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2">
                  <li className="flex items-center gap-2"><SmilePlus className="size-4 text-primary" /> Sentiment <span className="ml-auto font-medium">{result.sentiment}/100</span></li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-primary" /> Clarity <span className="ml-auto font-medium">{result.clarity}/100</span></li>
                  <li className="flex items-center gap-2"><Hash className="size-4 text-primary" /> Hashtags <span className="ml-auto font-medium">{result.hashtags}</span></li>
                </ul>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-base">Meta</CardTitle>
                <CardDescription>Mentions, links and more</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2">
                  <li className="flex items-center gap-2"><MessageCircle className="size-4 text-primary" /> Mentions <span className="ml-auto font-medium">{result.mentions}</span></li>
                  <li className="flex items-center gap-2"><LinkIcon className="size-4 text-primary" /> Links <span className="ml-auto font-medium">{result.links}</span></li>
                  <li className="flex items-center gap-2">CTA Present <span className={cn("ml-auto font-medium", result.cta ? "text-emerald-600" : "text-muted-foreground")}>{result.cta ? "Yes" : "No"}</span></li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-base">Content Profile</CardTitle>
                <CardDescription>How your post scores across dimensions</CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={result.radar} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="k" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                    <Radar dataKey="v" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-base">Top Keywords</CardTitle>
                <CardDescription>Terms driving the message</CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                {result.keywords.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No significant keywords detected.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={result.keywords} margin={{ left: 8, right: 8 }}>
                      <XAxis dataKey="key" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: "hsl(var(--primary)/0.08)" }} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 mt-6">
            <Card className="glass">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Suggested Hashtags</CardTitle>
                  <CardDescription>Tailored from your content</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={async () => {
                      const tags = result.hashtagSuggestions.join(" ");
                      await navigator.clipboard.writeText(tags);
                    }}
                  >
                    Copy
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => { if (result) setExcludeTags((prev) => Array.from(new Set([...prev, ...result.hashtagSuggestions]))); setRegen((r) => r + 1); }}
                  >
                    Regenerate
                  </Button>
                  <Button
                    onClick={() => {
                      const add = " " + result.hashtagSuggestions.join(" ");
                      setText((t) => (t.includes(add.trim()) ? t : (t.trim() + add).trim()));
                    }}
                  >
                    Add to caption
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {result.hashtagSuggestions.length === 0 ? (
                    <span className="text-sm text-muted-foreground">No more new tags — we reset the pool. Try Regenerate again.</span>
                  ) : null}
                  {result.hashtagSuggestions.map((h) => (
                    <span key={h} className="px-2.5 py-1 rounded-full text-xs bg-primary/10 text-primary border border-primary/20">
                      {h}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <CardTitle className="text-base">Optimized Variations</CardTitle>
                  <CardDescription>Drop-in improved captions</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setText(optimizeContent(text, platform, result).concise)}>Use concise</Button>
                  <Button variant="secondary" onClick={() => setText(optimizeContent(text, platform, result).benefit)}>Use benefit</Button>
                  <Button variant="secondary" onClick={() => setText(optimizeContent(text, platform, result).list)}>Use list</Button>
                </div>
              </CardHeader>
              <CardContent>
                {(() => {
                  const v = optimizeContent(text, platform, result);
                  return (
                    <div className="space-y-4 text-sm">
                      <div>
                        <p className="text-muted-foreground mb-1">Concise</p>
                        <div className="p-3 rounded-md border bg-card/50">{v.concise}</div>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Benefit-driven</p>
                        <div className="p-3 rounded-md border bg-card/50">{v.benefit}</div>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">List-style</p>
                        <div className="p-3 rounded-md border bg-card/50">{v.list}</div>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-base">How to improve</CardTitle>
                <CardDescription>Actionable recommendations for higher impact</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2 list-disc pl-5">
                  {result.sentiment < 60 && (
                    <li>Use more positive language or an exciting benefit to lift sentiment.</li>
                  )}
                  {result.clarity < 70 && (
                    <li>Shorten sentences and remove filler words to improve clarity.</li>
                  )}
                  {result.hashtagDensity < 30 && (
                    <li>Add 2–3 specific hashtags to increase discoverability.</li>
                  )}
                  {result.hashtagDensity > 70 && (
                    <li>Reduce the number of hashtags for a cleaner, more focused message.</li>
                  )}
                  {!result.cta && <li>Add a clear call-to-action (e.g., “Join the waitlist”, “Subscribe”).</li>}
                  {result.radar.find((d) => d.k === "Length")?.v &&
                    (result.radar.find((d) => d.k === "Length")!.v < 60 ? (
                      <li>Expand the content slightly to provide more context for this platform.</li>
                    ) : result.radar.find((d) => d.k === "Length")!.v > 90 ? (
                      <li>Trim the content to keep it punchy and within the platform sweet spot.</li>
                    ) : null)}
                  <li>
                    Post when your audience is most active: <span className="font-medium">{result.bestTime}</span>.
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>
      )}
    </div>
  );
}
