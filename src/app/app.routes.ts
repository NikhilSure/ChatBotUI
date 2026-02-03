import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'chat',
    loadChildren: () =>
      import('./chat/chat-module').then(m => m.ChatModule)
  },
  { path: '', redirectTo: 'chat', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
