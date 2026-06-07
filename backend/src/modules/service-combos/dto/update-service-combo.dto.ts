import { PartialType } from "@nestjs/swagger";
import { CreateServiceComboDto } from "./create-service-combo.dto";

export class UpdateServiceComboDto extends PartialType(CreateServiceComboDto) {}
