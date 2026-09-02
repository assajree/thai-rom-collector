import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GameListFilters, Tag, Translator } from '../models/patch.models';

@Component({
  selector: 'app-game-list-controls',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './game-list-controls.component.html',
  styleUrl: './game-list-controls.component.css'
})
export class GameListControlsComponent {
  @Input() tags: Tag[] = [];
  @Input() translators: Translator[] = [];
  @Input() systems: string[] = [];
  @Input() draft: GameListFilters = { keyword: '', tag: null, translatorId: null, system: null, sortBy: 'gameTitle', sortDirection: 'asc' };
  @Output() filtersChanged = new EventEmitter<GameListFilters>();
  @Input() viewMode: 'card' | 'table' = 'card';
  @Output() viewModeChange = new EventEmitter<'card' | 'table'>();
  protected emit(): void { this.filtersChanged.emit({ ...this.draft }); }
}
