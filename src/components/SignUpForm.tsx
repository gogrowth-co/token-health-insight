import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

// Define the form schema
const signUpSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" }),
  confirmPassword: z.string(),
})
.refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

export const SignUpForm = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const tokenFromQuery = queryParams.get('token') || '';
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: SignUpFormValues) => {
    setIsSubmitting(true);
    
    try {
      const { error } = await signUp(values.email, values.password, tokenFromQuery);
      
      if (error) {
        toast({
          title: "Error signing up",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Account created successfully!",
          description: "Welcome to Token Health Scan",
        });
      }
    } catch (error) {
      toast({
        title: "Something went wrong",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full shadow-lg border-neutral-100">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Create your account to view your scan</CardTitle>
        <CardDescription className="text-center">
          It only takes 10 seconds — no wallet required.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="name@example.com" 
                      type="email" 
                      autoComplete="email"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Create a password" 
                      type="password"
                      autoComplete="new-password"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Confirm your password" 
                      type="password"
                      autoComplete="new-password"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {tokenFromQuery && (
              <div className="bg-muted/50 px-3 py-2 rounded-md">
                <p className="text-sm text-muted-foreground">
                  You're creating an account to scan: <span className="font-mono">{tokenFromQuery}</span>
                </p>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                  Creating Account...
                </>
              ) : (
                <>
                  View My Scan <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4 pt-0">
        <p className="text-xs text-center text-muted-foreground">
          By signing up, you agree to our{" "}
          <Link to="/terms" className="text-primary hover:underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link to="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </CardFooter>
    </Card>
  );
};
