URL: https://v0.dev/chat/UxmF2QG86fi?b=b_g9vnHqQMPWl
---
1. You are viewing a user-generated chat created with v0. Use discretion when engaging with this content as the accuracy, completeness, and appropriateness are not guaranteed.





Don't show againDismiss


Close

Preview

Code

Console

Latest

Fork

×

v0

### Files

app

auth

login

page.tsx

reset-password

page.tsx

signup

page.tsx

components

AnimatedButton.tsx

CreatePromptDialog.tsx

GlobalSearch.tsx

Header.tsx

PromptCard.tsx

PromptFeed.tsx

TestPrompt.tsx

create

page.tsx

profile

\[username\]

page.tsx

page.tsx

prompt

\[id\]

test

page.tsx

page.tsx

prompts

categories

page.tsx

layout.tsx

page.tsx

app

auth

reset-password

page.tsx

'use client'

'use client'

import{ useState }from'react'

import{Button}from'@/components/ui/button'

import{Input}from'@/components/ui/input'

import{Card,CardContent,CardFooter,CardHeader,CardTitle}from'@/components/ui/card'

importLinkfrom'next/link'

exportdefaultfunctionResetPassword(){

const\[email, setEmail\]=useState('')

consthandleSubmit=(e:React.FormEvent)=>{

e.preventDefault()

// Handle reset password logic here

console.log({ email })

}

return(

<divclassName="container mx-auto flex items-center justify-center min-h-screen">

<CardclassName="w-full max-w-md">

<CardHeader>

<CardTitle>Reset Password</CardTitle>

</CardHeader>

<CardContent>

<formonSubmit={handleSubmit}className="space-y-4">

<div>

<labelhtmlFor="email">Email</label>

<Inputid="email"type="email"value={email}onChange={(e)=>setEmail(e.target.value)}required/>

</div>

<Buttontype="submit"className="w-full">Send Reset Link</Button>

</form>

</CardContent>

<CardFooter>

<pclassName="text-sm text-center w-full">

Remember your password?{' '}

<Linkhref="/auth/login"className="text-blue-600 hover:underline">

Log in

</Link>

</p>

</CardFooter>

</Card>

</div>

)

}

### Console Output

0events

No console output available to display

![Avatar](https://vercel.com/api/www/avatar/ozvpLOHDtkBmCFscETcGCPlG)Shared by ariomoniri