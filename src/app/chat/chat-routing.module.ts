import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ChatHome } from './chat-home/chat-home';

const routes: Routes = [
  {
    path: '',
    component: ChatHome
  }
];  

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ChatRoutingModule {}
