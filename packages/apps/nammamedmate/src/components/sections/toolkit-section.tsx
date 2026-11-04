import { BarcodeIcon } from '@/components/icons/BarcodeIcon';
import { HospitalIcon } from '@/components/icons/HospitalIcon';
import { InventoryBoxIcon } from '@/components/icons/InventoryBoxIcon';
import { InvoiceIcon } from '@/components/icons/InvoiceIcon';
import { PrescriptionIcon } from '@/components/icons/PrescriptionIcon';
import { PurchaseIcon } from '@/components/icons/PurchaseIcon';
import { ReorderIcon } from '@/components/icons/ReorderIcon';
import { SalesChartIcon } from '@/components/icons/SalesChartIcon';
import { StorageLayersIcon } from '@/components/icons/StorageLayersIcon';
export function ToolkitSection() {
  return (
    <section className="nl-sec" id="toolkit" style={{ background: '#fff' }}>
      <div className="nl-wrap">
        <div className="nl-sec-head">
          <span className="nl-eyebrow" style={{ justifyContent: 'center' }}>
            The complete toolkit
          </span>
          <h2>Every tool your counter needs</h2>
          <p>
            {
              "Billing, stock, purchases, reports and compliance — retail counter or hospital pharmacy, it's all in one console. No add-ons, no extra logins."
            }
          </p>
        </div>
        <div className="nl-tool-grid">
          <div className="nl-tool">
            <div className="nl-tool-ic">
              <InvoiceIcon />
            </div>
            <div>
              <h3>{'GST billing & POS'}</h3>
              <p>
                {
                  'Fast counter billing with correct CGST/SGST splits, printable & shareable invoices, loose-strip selling.'
                }
              </p>
            </div>
          </div>
          <div className="nl-tool">
            <div className="nl-tool-ic">
              <InventoryBoxIcon />
            </div>
            <div>
              <h3>{'Inventory & stock alerts'}</h3>
              <p>
                Batch-wise inventory with FEFO dispensing and automatic
                stock-expiry and restocking notifications — near-expiry batches
                and low-stock items are flagged in advance, so nothing lapses or
                runs out.
              </p>
            </div>
          </div>
          <div className="nl-tool">
            <div className="nl-tool-ic">
              <PurchaseIcon />
            </div>
            <div>
              <h3>{'Purchases & goods-inward'}</h3>
              <p>
                Enter a distributor bill and stock updates itself; track input
                GST credit automatically.
              </p>
            </div>
          </div>
          <div className="nl-tool">
            <div className="nl-tool-ic">
              <ReorderIcon />
            </div>
            <div>
              <h3>{'Auto reorder & POs'}</h3>
              <p>
                Low-stock lists grouped by distributor — review and send
                purchase orders in a couple of clicks.
              </p>
            </div>
          </div>
          <div className="nl-tool">
            <div className="nl-tool-ic">
              <StorageLayersIcon />
            </div>
            <div>
              <h3>{'Rack & bin locations'}</h3>
              <p>
                Map every medicine to a shelf code so staff read it on screen
                and walk straight to the spot.
              </p>
            </div>
          </div>
          <div className="nl-tool">
            <div className="nl-tool-ic">
              <BarcodeIcon />
            </div>
            <div>
              <h3>{'Barcode & batch billing'}</h3>
              <p>
                Scan a strip to pin the exact batch — accurate expiry, pricing
                and stock deduction every time.
              </p>
            </div>
          </div>
          <div className="nl-tool">
            <div className="nl-tool-ic">
              <SalesChartIcon />
            </div>
            <div>
              <h3>{'Reports & GST filing'}</h3>
              <p>
                {
                  'Sales, profit, dead-stock and a ready GST P&L; share straight to your CA or accountant.'
                }
              </p>
            </div>
          </div>
          <div className="nl-tool">
            <div className="nl-tool-ic">
              <PrescriptionIcon />
            </div>
            <div>
              <h3>Prescription queue</h3>
              <p>
                Receive, verify and dispense e-prescriptions with a compliant
                Schedule-H workflow.
              </p>
            </div>
          </div>
          <div className="nl-tool">
            <div className="nl-tool-ic">
              <HospitalIcon />
            </div>
            <div>
              <h3>{'Hospital & ward module'}</h3>
              <p>
                Wards, admissions, bed maps and bill-to-hospital credit — for
                pharmacies inside hospitals.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
