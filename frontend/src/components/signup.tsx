import React, { useState } from "react";
import { Bot, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../hooks/use-toast";

interface SignupProps {
  onSwitchToLogin: () => void;
}

export const Signup: React.FC<SignupProps> = ({ onSwitchToLogin }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signup } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;

    setIsSubmitting(true);
    try {
      await signup(name, email, password);
      toast({
        title: "Success",
        description: "Account created successfully!",
      });
    } catch (error: any) {
      console.error("Signup error details:", error.response?.data);
      const errorData = error.response?.data;
      let description = "Signup failed. Please try again.";
      
      if (errorData) {
        if (Array.isArray(errorData.message)) {
          description = errorData.message.join(", ");
        } else if (typeof errorData.message === 'string') {
          description = errorData.message;
        } else if (errorData.error) {
          description = errorData.error;
        }
      } else if (error.message) {
        description = error.message;
      }

      toast({
        variant: "destructive",
        title: "Signup Failed",
        description,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto">
            <Bot className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-xl font-semibold">
            Create an Account
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Join AI Assistant to start chatting.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Sign Up"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <button
              onClick={onSwitchToLogin}
              className="text-primary hover:underline font-medium"
            >
              Log in
            </button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};
