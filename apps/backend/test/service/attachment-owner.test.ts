import { ContractAttachmentService } from '../../src/service/contract-attachment.service';
import { InvoiceAttachmentService } from '../../src/service/invoice-attachment.service';

describe('attachment owner kit lookup', () => {
  it('resolves contract attachment kit from its contract relation', async () => {
    const service = new ContractAttachmentService();
    const attachment = {
      attachment_id: 3,
      contract_id: 5,
      contract: { kit_id: 8 },
    };
    service.contractAttachmentRepository = {
      findOne: jest.fn().mockResolvedValue(attachment),
    } as any;

    await expect(service.getAttachmentWithKit(3)).resolves.toEqual({
      attachment,
      kitId: 8,
    });
    expect(service.contractAttachmentRepository.findOne).toHaveBeenCalledWith({
      where: { attachment_id: 3 },
      relations: ['contract'],
    });
  });

  it('resolves invoice attachment kit from its invoice relation', async () => {
    const service = new InvoiceAttachmentService();
    const attachment = {
      attachment_id: 4,
      invoice_id: 6,
      invoice: { kit_id: 9 },
    };
    service.invoiceAttachmentRepository = {
      findOne: jest.fn().mockResolvedValue(attachment),
    } as any;

    await expect(service.getAttachmentWithKit(4)).resolves.toEqual({
      attachment,
      kitId: 9,
    });
    expect(service.invoiceAttachmentRepository.findOne).toHaveBeenCalledWith({
      where: { attachment_id: 4 },
      relations: ['invoice'],
    });
  });
});
