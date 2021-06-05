import { AfterViewInit, Component, ElementRef, HostListener, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { CallService } from '../../../core/services/call.service';

const DRAW_DATA = "DrawData";

const enum DrawColor {
  red = "red",
  blue = "blue",
  white = "white",
  black = "black"
}

const enum MouseStates {
  mousedown = "mousedown",
  mouseup = "mouseup",
  mousemove = "mousemove"
}

interface DrawMessageFormat {
  x: number
  y: number
  color: DrawColor,
  drawer: string,
  isContinuation: boolean
}
@Component({
  selector: 'app-draw',
  templateUrl: './draw.component.html',
  styleUrls: ['./draw.component.scss']
})
export class DrawComponent implements OnInit, OnChanges, AfterViewInit {

  constructor(private callService: CallService) { }

  @Input() isConnected = false;

  public isDrawing = false;

  public color = DrawColor.white;

  public isContinuation = false;

  private context: CanvasRenderingContext2D;
  private context2: CanvasRenderingContext2D;

  @ViewChild('drawcanvas')
  public canvasEl: ElementRef<HTMLCanvasElement>;

  @ViewChild('pencil')
  public pencil: ElementRef<HTMLImageElement>;

  ngOnInit(): void {
    this.callService.clearDrawing$.subscribe(() => {
      this.clearBoard();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes?.isConnected) {
      this.callService.getMeetingSession()?.audioVideo.realtimeSubscribeToReceiveDataMessage(DRAW_DATA, (dataMessage) => {
        const msg = <DrawMessageFormat>dataMessage.json();
        const xMultiplied = msg.x * window.innerWidth;
        const yMultiplied = msg.y * window.innerWidth;
        if (!msg.isContinuation) {
          this.context2.beginPath();
          this.context2.moveTo(xMultiplied, yMultiplied);
        }
        this.drawStroke(this.context2, xMultiplied, yMultiplied, msg.color);
      });
    }
  }

  ngAfterViewInit(): void {
    this.context = this.canvasEl.nativeElement.getContext('2d');
    this.context2 = this.canvasEl.nativeElement.getContext('2d');
    this.canvasEl.nativeElement.width = window.innerWidth;
    this.canvasEl.nativeElement.height = window.innerHeight;
    this.context.lineCap = "round";
    this.context.lineJoin = "round";
    this.context.lineWidth = 10;
  }

  public clearBoard(): void {
    this.context.clearRect(0,0,window.innerWidth, window.innerHeight);
    this.context2.clearRect(0,0,window.innerWidth, window.innerHeight);

  }

  @HostListener('window:mousedown', ['$event'])
  private beginDraw(e: MouseEvent): void {
    this.isDrawing = true;

    this.context.beginPath();
    this.context.moveTo(e.clientX, e.clientY);
    this.draw(e);
  }

  @HostListener('window:mouseup', ['$event'])
  private endDraw(): void {
    this.isDrawing = false;
    this.isContinuation = false;
  }

  @HostListener('window:mousemove', ['$event'])
  private draw(e: MouseEvent): void {
    this.pencil.nativeElement.style.top = `${e.clientY}px`;
    this.pencil.nativeElement.style.left = `${e.clientX}px`;
    
    if (this.isDrawing) {
      this.drawStroke(this.context, e.clientX, e.clientY);

      this.callService.getMeetingSession()?.audioVideo.realtimeSendDataMessage(DRAW_DATA, <DrawMessageFormat>{
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
        drawer: this.callService.getMeetingSession().configuration.credentials.attendeeId,
        color: this.color,
        isContinuation: this.isContinuation
      });

      this.isContinuation = true;
    }
  }

  public drawStroke(ctx: CanvasRenderingContext2D, x: number, y: number, color: DrawColor = DrawColor.white): void {
    ctx.strokeStyle = color;
    ctx.lineTo(x, y);
    ctx.stroke();
  }
}
