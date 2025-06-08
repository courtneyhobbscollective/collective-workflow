
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Search } from "lucide-react";

interface GifPickerProps {
  onGifSelect: (gifUrl: string) => void;
  onClose: () => void;
}

// Mock GIF data - in a real app, you'd use the Giphy API
const MOCK_GIFS = [
  { id: "1", url: "https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif", title: "Thumbs Up" },
  { id: "2", url: "https://media.giphy.com/media/l0MYGb1LuZ3n7dRnO/giphy.gif", title: "Applause" },
  { id: "3", url: "https://media.giphy.com/media/26u4lOMA8JKSnL9Uk/giphy.gif", title: "Dance" },
  { id: "4", url: "https://media.giphy.com/media/xT1XGESDlxj0GwoDRe/giphy.gif", title: "Success" },
  { id: "5", url: "https://media.giphy.com/media/3o6Zt0hNCfak3QCqsw/giphy.gif", title: "Mind Blown" },
  { id: "6", url: "https://media.giphy.com/media/3ohzdIuqJoo8QdKlnW/giphy.gif", title: "High Five" },
  { id: "7", url: "https://media.giphy.com/media/l0HlvtIPzPdt2usKs/giphy.gif", title: "Celebration" },
  { id: "8", url: "https://media.giphy.com/media/xT1XGU75xwO8vAY8aQ/giphy.gif", title: "Laughing" },
];

export function GifPicker({ onGifSelect, onClose }: GifPickerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredGifs, setFilteredGifs] = useState(MOCK_GIFS);

  useEffect(() => {
    if (searchTerm) {
      const filtered = MOCK_GIFS.filter(gif => 
        gif.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredGifs(filtered);
    } else {
      setFilteredGifs(MOCK_GIFS);
    }
  }, [searchTerm]);

  return (
    <Card className="w-96 h-96 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm">GIFs</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="relative mb-3">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search for GIFs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <ScrollArea className="h-72">
          <div className="grid grid-cols-2 gap-2">
            {filteredGifs.map((gif) => (
              <Button
                key={gif.id}
                variant="outline"
                className="h-24 w-full p-1 overflow-hidden"
                onClick={() => onGifSelect(gif.url)}
              >
                <img
                  src={gif.url}
                  alt={gif.title}
                  className="w-full h-full object-cover rounded"
                />
              </Button>
            ))}
          </div>
          {filteredGifs.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              No GIFs found for "{searchTerm}"
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
