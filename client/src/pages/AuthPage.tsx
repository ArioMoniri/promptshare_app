import { useState, useEffect, useRef } from "react";
import { useUser } from "../hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { insertUserSchema } from "@db/schema";
import { z } from "zod";
import { Code2 } from "lucide-react";

export default function AuthPage() {
  const { login, register } = useUser();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);

  const form = useForm({
    resolver: zodResolver(
      isLogin
        ? insertUserSchema.pick({ username: true, password: true })
        : insertUserSchema.extend({
            confirmPassword: z.string()
          }).refine((data) => data.password === data.confirmPassword, {
            message: "Passwords don't match",
            path: ["confirmPassword"],
          })
    ),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      email: "",
      name: "",
      surname: "",
    },
  });

  const onSubmit = async (data: any) => {
    try {
      console.log('Form submitted:', data);
      const result = await (isLogin 
        ? login({ username: data.username, password: data.password })
        : register(data));

      console.log('Auth result:', result);
      
      if (!result.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message,
        });
      }
    } catch (error: any) {
      console.error('Form submission error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);

  const handleVideoError = (e: any) => {
    console.error('Video loading error:', e);
    const video = e.target as HTMLVideoElement;
    console.error('Video error details:', {
      error: video.error,
      networkState: video.networkState,
      readyState: video.readyState
    });
    if (videoRef.current) {
      videoRef.current.style.display = 'none';
    }
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play();
    }
  }, []);

  return (
    <div className="relative min-h-screen flex items-center justify-center">
      {/* Video Background */}
      <video
        ref={videoRef}
        className="absolute top-0 left-0 w-full h-full object-cover -z-10 transition-opacity duration-500"
        autoPlay
        muted
        loop={false}
        playsInline
        onError={handleVideoError}
        onLoadedData={() => setVideoLoaded(true)}
        style={{ opacity: videoLoaded ? 1 : 0 }}
      >
        <source src="/assets/videos/Gen 3 Alpha Turbo Adventure.mp4" type="video/mp4" />
      </video>

      {/* Overlay to ensure content is readable */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm -z-5" />

      {/* Auth content */}
      <div className="relative z-10">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <Code2 className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl text-center">
              {isLogin ? "Welcome back" : "Create an account"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {!isLogin && (
                  <>
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="surname"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Surname</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {!isLogin && (
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <Button type="submit" className="w-full">
                  {isLogin ? "Sign In" : "Sign Up"}
                </Button>
              </form>
            </Form>

            <div className="mt-4 text-center">
              <Button
                variant="link"
                onClick={() => {
                  setIsLogin(!isLogin);
                  form.reset();
                }}
                className="text-sm"
              >
                {isLogin
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Sign in"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
