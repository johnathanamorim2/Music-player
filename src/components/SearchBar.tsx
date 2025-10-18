import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
import { useState } from "react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export const SearchBar = ({ onSearch, isLoading }: SearchBarProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim() || isLoading) return;
    onSearch(searchTerm);
  };

  return (
    <form onSubmit={handleSearch} className="w-full max-w-lg flex gap-2 mx-auto">
      <Input
        type="text"
        placeholder="Digite o nome da música ou artista..."
        className="bg-gray-800 border-gray-700 focus:ring-purple-500 focus:border-purple-500"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        disabled={isLoading}
      />
      <Button type="submit" className="bg-purple-600 hover:bg-purple-500" disabled={isLoading}>
        {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
      </Button>
    </form>
  );
};