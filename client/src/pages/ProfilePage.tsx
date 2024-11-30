'use client'

import { useState } from 'react'
import { useUser } from '@/hooks/use-user'
import { usePrompts } from '@/hooks/use-prompts'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { insertUserSchema } from '@db/schema'
import { Loader2, User } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import PromptCard from '@/components/PromptCard'

export default function ProfilePage() {
  const { user } = useUser()
  const { prompts } = usePrompts()
  const { toast } = useToast()
  const [isUpdating, setIsUpdating] = useState(false)

  const form = useForm({
    resolver: zodResolver(insertUserSchema.pick({ 
      name: true, 
      surname: true,
      email: true 
    })),
    defaultValues: {
      name: user?.name || '',
      surname: user?.surname || '',
      email: user?.email || ''
    }
  })

  const onSubmit = async (data: any) => {
    try {
      setIsUpdating(true)
      // TODO: Implement update profile API
      toast({
        title: 'Success',
        description: 'Profile updated successfully'
      })
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const userPrompts = prompts?.filter(prompt => prompt.authorId === user?.id) || []
  const likedPrompts = prompts?.filter(prompt => prompt.likes?.includes(user?.id || 0)) || []

  return (
    <div className="container mx-auto py-6">
      <div className="grid gap-6">
        {/* Profile Header */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback>
                <User className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{user?.name} {user?.surname}</CardTitle>
              <CardDescription>@{user?.username}</CardDescription>
            </div>
          </CardHeader>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="prompts">
          <TabsList>
            <TabsTrigger value="prompts">My Prompts</TabsTrigger>
            <TabsTrigger value="liked">Liked Prompts</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="prompts">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {userPrompts.map((prompt) => (
                <PromptCard key={prompt.id} {...prompt} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="liked">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {likedPrompts.map((prompt) => (
                <PromptCard key={prompt.id} {...prompt} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>Update your profile information</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
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
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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
                    <Button type="submit" disabled={isUpdating}>
                      {isUpdating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Update Profile"
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
