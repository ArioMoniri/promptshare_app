'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import PromptCard from '../components/PromptCard'

export default function UserProfile() {
  const [username, setUsername] = useState('johndoe')
  const [email, setEmail] = useState('john@example.com')
  const [openAIKey, setOpenAIKey] = useState('')

  // Mock data - replace with actual data fetching
  const myPrompts = [/* ... */]
  const likedPrompts = [/* ... */]
  const starredPrompts = [/* ... */]
  const forks = [/* ... */]
  const issues = [/* ... */]
  const pullRequests = [/* ... */]

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src="/placeholder-avatar.jpg" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">John Doe</CardTitle>
              <CardDescription>@johndoe</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="profile">
            <TabsList>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="prompts">My Prompts</TabsTrigger>
              <TabsTrigger value="liked">Liked</TabsTrigger>
              <TabsTrigger value="starred">Starred</TabsTrigger>
              <TabsTrigger value="forks">Forks</TabsTrigger>
              <TabsTrigger value="issues">Issues</TabsTrigger>
              <TabsTrigger value="pullrequests">Pull Requests</TabsTrigger>
            </TabsList>
            <TabsContent value="profile">
              <form className="space-y-4">
                <div>
                  <label htmlFor="username">Username</label>
                  <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="email">Email</label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="openai-key">OpenAI API Key</label>
                  <Input id="openai-key" type="password" value={openAIKey} onChange={(e) => setOpenAIKey(e.target.value)} />
                </div>
                <Button type="submit">Save Changes</Button>
              </form>
            </TabsContent>
            <TabsContent value="prompts">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {myPrompts.map((prompt) => (
                  <PromptCard key={prompt.id} {...prompt} />
                ))}
              </div>
            </TabsContent>
            {/* Similar structure for other tabs */}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

