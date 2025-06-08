
import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Staff {
  name: string;
  email: string;
  profile_picture_url?: string | null;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  onSubmit: () => void;
  allStaff: Staff[];
}

export function MentionInput({ value, onChange, placeholder, onSubmit, allStaff }: MentionInputProps) {
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [mentionPosition, setMentionPosition] = useState(0);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const mentionRef = useRef<HTMLDivElement>(null);

  const filteredStaff = allStaff.filter(staff =>
    staff.name.toLowerCase().includes(mentionSearch.toLowerCase()) ||
    staff.email.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mentionRef.current && !mentionRef.current.contains(event.target as Node)) {
        setShowMentions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const cursorPosition = e.target.selectionStart || 0;
    
    onChange(newValue);

    // Check if we're typing a mention
    const textBeforeCursor = newValue.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      
      // Check if there's a space after @ (which would end the mention)
      if (!textAfterAt.includes(' ') && textAfterAt.length >= 0) {
        setMentionSearch(textAfterAt);
        setMentionPosition(lastAtIndex);
        setShowMentions(true);
        setSelectedMentionIndex(0);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showMentions && filteredStaff.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMentionIndex(prev => 
          prev < filteredStaff.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIndex(prev => 
          prev > 0 ? prev - 1 : filteredStaff.length - 1
        );
      } else if (e.key === 'Tab' || e.key === 'Enter') {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          if (showMentions) {
            selectMention(filteredStaff[selectedMentionIndex]);
            return;
          }
          onSubmit();
        } else if (e.key === 'Tab') {
          e.preventDefault();
          selectMention(filteredStaff[selectedMentionIndex]);
        }
      } else if (e.key === 'Escape') {
        setShowMentions(false);
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  const selectMention = (staff: Staff) => {
    const beforeMention = value.substring(0, mentionPosition);
    const afterMention = value.substring(mentionPosition + mentionSearch.length + 1);
    const firstName = staff.name.split(' ')[0];
    const newValue = `${beforeMention}@${firstName} ${afterMention}`;
    
    onChange(newValue);
    setShowMentions(false);
    
    // Focus back to input and set cursor position
    setTimeout(() => {
      if (inputRef.current) {
        const newCursorPosition = mentionPosition + firstName.length + 2;
        inputRef.current.focus();
        inputRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
      }
    }, 0);
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="pr-24"
      />
      
      {showMentions && filteredStaff.length > 0 && (
        <Card 
          ref={mentionRef}
          className="absolute bottom-full mb-2 w-64 max-h-48 overflow-y-auto z-50 shadow-lg"
        >
          <div className="p-2">
            <div className="text-xs text-muted-foreground mb-2 px-2">Mention someone</div>
            {filteredStaff.map((staff, index) => (
              <div
                key={staff.email}
                className={`flex items-center p-2 rounded cursor-pointer hover:bg-muted ${
                  index === selectedMentionIndex ? 'bg-muted' : ''
                }`}
                onClick={() => selectMention(staff)}
              >
                <Avatar className="w-6 h-6 mr-2">
                  <AvatarImage src={staff.profile_picture_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {staff.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-sm font-medium">{staff.name}</div>
                  <div className="text-xs text-muted-foreground">{staff.email}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
