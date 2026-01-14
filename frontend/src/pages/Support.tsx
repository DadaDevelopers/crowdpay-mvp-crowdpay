import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Helmet } from "react-helmet-async";
import {
  HelpCircle,
  MessageCircle,
  Mail,
  FileText,
  ExternalLink,
  Send,
  ChevronDown,
  Zap,
  Shield,
  CreditCard,
  Users
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How do I receive Bitcoin contributions?",
    answer: "CrowdPay automatically creates a Bitcoin wallet for you when you sign up. All contributions sent via Lightning or on-chain go directly to your wallet. You can also configure your own external Lightning address in Settings.",
    icon: Zap,
  },
  {
    question: "How does M-Pesa to Bitcoin conversion work?",
    answer: "When someone contributes via M-Pesa, the funds are automatically converted to Bitcoin through our Minmo integration and deposited into your wallet. The conversion happens in real-time at market rates.",
    icon: CreditCard,
  },
  {
    question: "Is my wallet secure?",
    answer: "Yes! Your CrowdPay wallet is powered by Blink, a trusted Lightning wallet provider. Your funds are secured with industry-standard encryption and you maintain full control over your Bitcoin.",
    icon: Shield,
  },
  {
    question: "Can I create multiple payment links?",
    answer: "Absolutely! You can create unlimited payment links for different events, causes, or projects. Each link can have its own custom settings, goal amount, and theme.",
    icon: Users,
  },
  {
    question: "What fees does CrowdPay charge?",
    answer: "CrowdPay charges a small 1-2% fee on M-Pesa contributions to cover conversion costs. Lightning and on-chain Bitcoin contributions have minimal network fees only.",
    icon: CreditCard,
  },
  {
    question: "How do I withdraw my funds?",
    answer: "You can withdraw your Bitcoin balance at any time via Lightning (instant) or on-chain transfer. Go to the Wallet page and click 'Send' to initiate a withdrawal.",
    icon: Zap,
  },
];

const Support = () => {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    // Simulate sending
    await new Promise(resolve => setTimeout(resolve, 1000));

    toast({
      title: "Message sent!",
      description: "We'll get back to you within 24 hours.",
    });

    setName("");
    setEmail("");
    setMessage("");
    setSending(false);
  };

  return (
    <>
      <Helmet>
        <title>Support - CrowdPay</title>
        <meta name="description" content="Get help with CrowdPay" />
      </Helmet>

      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Support</h1>
          <p className="text-muted-foreground">Get help and find answers to your questions</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* FAQ Section */}
          <div className="space-y-6">
            <Card className="border border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  Frequently Asked Questions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {faqs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left hover:no-underline">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <faq.icon className="h-4 w-4 text-primary" />
                          </div>
                          <span className="text-sm font-medium">{faq.question}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground pl-11">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card className="border border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-5 w-5 text-primary" />
                  Quick Links
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <a href="#" className="flex items-center gap-3">
                    <FileText className="h-4 w-4" />
                    Documentation
                    <ExternalLink className="h-3 w-3 ml-auto" />
                  </a>
                </Button>
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <a href="#" className="flex items-center gap-3">
                    <MessageCircle className="h-4 w-4" />
                    Community Discord
                    <ExternalLink className="h-3 w-3 ml-auto" />
                  </a>
                </Button>
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <a href="#" className="flex items-center gap-3">
                    <Mail className="h-4 w-4" />
                    Email Support
                    <ExternalLink className="h-3 w-3 ml-auto" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <Card className="border border-border/50 bg-card/80 backdrop-blur-sm h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                Contact Us
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Name</label>
                  <Input
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Email</label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Message</label>
                  <Textarea
                    placeholder="How can we help you?"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={sending}
                >
                  {sending ? (
                    <>Sending...</>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-sm text-muted-foreground text-center">
                  We typically respond within 24 hours
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Support;
