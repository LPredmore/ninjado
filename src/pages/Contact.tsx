import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { SupabaseClient } from "@supabase/supabase-js";
import SidebarLayout from "@/components/SidebarLayout";
import { NinjaScrollCard } from "@/components/ninja/NinjaScrollCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTimeTracking } from "@/contexts/TimeTrackingContext";
import { MessageSquare, Mail, Send } from "lucide-react";
import { toast } from "sonner";

interface ContactProps {
  user: User;
  supabase: SupabaseClient;
}

const Contact = ({ user, supabase }: ContactProps) => {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { totalTimeSaved } = useTimeTracking();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject.trim() || !message.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // For now, we'll just show a success message
      // In a real app, you'd integrate with an email service or database
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      toast.success("Message sent successfully! We'll get back to you soon.");
      setSubject("");
      setMessage("");
    } catch (error) {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SidebarLayout onSignOut={handleSignOut} totalTimeSaved={totalTimeSaved}>
      <div className="container mx-auto p-6 max-w-3xl space-y-8">
        
        {/* Page Header */}
        <div className="text-center">
          <div className="clay-element w-20 h-20 gradient-clay-accent rounded-full mx-auto mb-4 flex items-center justify-center glow-jade">
            <MessageSquare className="w-10 h-10 text-accent-foreground" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent mb-2">
            Contact Us
          </h1>
          <p className="text-muted-foreground">We're here to help! Send us your questions, suggestions, or feedback.</p>
        </div>

        {/* Contact Form */}
        <NinjaScrollCard title="📬 Send us a Message" variant="default">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Email Display */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2 text-foreground font-medium">
                <Mail className="w-4 h-4 text-accent" />
                Your Email
              </Label>
              <Input
                id="email"
                value={user.email || ""}
                disabled
                className="clay-element bg-muted/50 border-border/50"
              />
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject" className="text-foreground font-medium">
                Subject
              </Label>
              <Input
                id="subject"
                placeholder="What's this about?"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="clay-element"
                required
              />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message" className="text-foreground font-medium">
                Message
              </Label>
              <Textarea
                id="message"
                placeholder="Tell us what's on your mind..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="clay-element min-h-32 resize-none"
                required
              />
            </div>

            {/* Submit Button */}
            <Button 
              type="submit"
              disabled={isSubmitting}
              variant="clay-jade"
              size="lg"
              className="w-full"
            >
              {isSubmitting ? (
                "Sending..."
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </form>
        </NinjaScrollCard>

        {/* Additional Info */}
        <NinjaScrollCard title="💡 Quick Tips" variant="default">
          <div className="space-y-4">
            <div className="clay-element p-4 bg-muted/30">
              <h3 className="font-semibold text-foreground mb-2">🐛 Reporting a Bug?</h3>
              <p className="text-sm text-muted-foreground">
                Please describe what you were doing when the bug occurred, and what you expected to happen instead.
              </p>
            </div>
            
            <div className="clay-element p-4 bg-muted/30">
              <h3 className="font-semibold text-foreground mb-2">💡 Have a Feature Idea?</h3>
              <p className="text-sm text-muted-foreground">
                We love hearing new ideas! Tell us how you think we can make NinjaDo even better.
              </p>
            </div>
            
            <div className="clay-element p-4 bg-muted/30">
              <h3 className="font-semibold text-foreground mb-2">❓ Need Help?</h3>
              <p className="text-sm text-muted-foreground">
                Check out our "How to Use" page first, but don't hesitate to reach out if you're still stuck!
              </p>
            </div>
          </div>
        </NinjaScrollCard>

      </div>
    </SidebarLayout>
  );
};

export default Contact;