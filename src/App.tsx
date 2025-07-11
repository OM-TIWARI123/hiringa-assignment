import { createBrowserRouter, createRoutesFromElements, Route,Routes, RouterProvider } from 'react-router-dom'
import  {SignInForm}  from './SignInForm'
import { Authenticated } from 'convex/react'
import { CampaignHistory } from './CampaignHistory'
import { CreateCampaign } from './CreateCampaign'
import { RequireAuth } from './RequireAuth'
import { CompanyAssets } from './CompanyAssets'
import { ReviewPosts } from './ReviewPosts'
import { EditPhoto } from './EditPhoto'

const router=createBrowserRouter(
    createRoutesFromElements(
        <Route>
            <Route path='/' element={<SignInForm/>}/>
            
              <Route path='/campaigns' element={
                <RequireAuth>
                    <CampaignHistory onCampaignSelect={()=>{}}/>
                </RequireAuth>}/>
              
                <Route path='/createcompany' element={
                <RequireAuth>
                    <CompanyAssets/>
                </RequireAuth>}/>
                <Route path='/createcampaign' element={
                <RequireAuth>
                  <CreateCampaign onCampaignCreated={() => {}} />
                </RequireAuth>
                }/>

                <Route path='/campaigns' element={
                    <RequireAuth>
                        <CampaignHistory/>
                    </RequireAuth>
                    }/>
                <Route path='/campaign/:id' element={
                    <RequireAuth>
                        <ReviewPosts/>
                        <EditPhoto/>
                    </RequireAuth>
                }>
                    
            
              
            
        
        </Route>
    )
)

export function App(){
   return <RouterProvider router={router}/>
}