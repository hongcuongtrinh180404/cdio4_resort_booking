import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

@Injectable()
@WebSocketGateway({
  cors: { origin: "*", credentials: true },
  namespace: "/ws",
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(private jwtService: JwtService) {}

  handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.query?.token;
      if (!token) {
        client.disconnect();
        return;
      }
      const decoded = this.jwtService.verify(token as string) as { sub: number; role: string };
      const userId = decoded.sub;
      const role = decoded.role;

      client.join(`user:${userId}`);

      if (role === "ADMIN" || role === "EMPLOYEE") {
        client.join("staff");
      }

      client.data.userId = userId;
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    // Cleanup handled automatically by socket.io
  }

  sendToUser(userId: number, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  sendToStaff(event: string, data: any) {
    this.server.to("staff").emit(event, data);
  }
}
